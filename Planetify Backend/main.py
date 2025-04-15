from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from spotipy import Spotify
from spotipy.oauth2 import SpotifyOAuth
from pydantic import BaseModel
import cv2
import numpy as np
from sklearn.cluster import KMeans
import requests, asyncio
from io import BytesIO
from concurrent.futures import ThreadPoolExecutor
from functools import lru_cache
from config import settings

app = FastAPI()
executor = ThreadPoolExecutor()

# Permitir CORS
origins = ["http://localhost:5173"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configura las credenciales de Spotify
client_id = settings.spotipy_client_id
client_secret = settings.spotipy_client_secret
redirect_uri = settings.spotipy_redirect_uri
scope = "user-top-read user-read-currently-playing user-modify-playback-state"

if not client_id or not client_secret or not redirect_uri:
    raise ValueError("No se encontraron las variables de entorno necesarias.")

sp_oauth = SpotifyOAuth(client_id=client_id,
                        client_secret=client_secret,
                        redirect_uri=redirect_uri,
                        scope=scope)

class ImageUrlsRequest(BaseModel):
    image_urls: list[str]
    num_colors: int = 10

def extract_colors_from_bytes(image_bytes, num_colors=10):
    np_array = np.frombuffer(image_bytes, np.uint8)
    image = cv2.imdecode(np_array, cv2.IMREAD_COLOR)
    image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    image = cv2.resize(image, (600, 400))
    pixels = image.reshape(-1, 3)
    kmeans = KMeans(n_clusters=num_colors, n_init='auto')
    kmeans.fit(pixels)
    colors = kmeans.cluster_centers_
    colors = colors.astype(int)
    return colors.tolist()

def extract_colors_from_multiple_images(image_urls, num_colors=10):
    all_pixels = []
    for url in image_urls:
        response = requests.get(url)
        image_bytes = BytesIO(response.content).read()
        np_array = np.frombuffer(image_bytes, np.uint8)
        image = cv2.imdecode(np_array, cv2.IMREAD_COLOR)
        image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        image = cv2.resize(image, (600, 400))
        pixels = image.reshape(-1, 3)
        all_pixels.extend(pixels)  # Append all pixels to the list

    all_pixels = np.array(all_pixels)
    kmeans = KMeans(n_clusters=num_colors, n_init='auto')
    kmeans.fit(all_pixels)
    colors = kmeans.cluster_centers_
    colors = colors.astype(int)
    return colors.tolist()

@app.get("/extract_colors_unique_image", tags=["Color Algorithm"])
async def get_colors_unique_image(image_url: str, num_colors: int = 5):
    response = requests.get(image_url)
    image_bytes = BytesIO(response.content).read()
    colors = extract_colors_from_bytes(image_bytes, num_colors)
    return {"colors": colors}

@app.post("/extract_colors_multiple_images", tags=["Color Algorithm"])
async def get_colors_multiple_images(request: ImageUrlsRequest):
    colors = extract_colors_from_multiple_images(request.image_urls, request.num_colors)
    return {"colors": colors}

@app.get("/login", tags=["Authentication"])
async def login():
    auth_url = sp_oauth.get_authorize_url()
    return {"auth_url": auth_url}

@app.get("/callback", tags=["Authentication"])
async def callback(code: str):
    token_info = sp_oauth.get_access_token(code)
    if not token_info:
        raise HTTPException(status_code=400, detail="Authentication failed")
    return {"access_token": token_info['access_token']}

@app.get("/top_tracks", tags=["Spotify"])
async def top_tracks(token: str, limit: int, time_range: str):
    sp = Spotify(auth=token)
    results = sp.current_user_top_tracks(limit=limit, time_range=time_range)
    return results

async def fetch_artist_top_track(sp, artist_id):
    loop = asyncio.get_running_loop()
    artist_tracks = await loop.run_in_executor(executor, sp.artist_top_tracks, artist_id)
    
    # Filtrar la primera canción donde el artista sea el único intérprete del track
    track = next((track for track in artist_tracks['tracks'] if len(track['artists']) == 1 and track['artists'][0]['id'] == artist_id), None)
    
    # Si no se encuentra una canción donde el artista sea el único intérprete, usar la primera canción
    if track is None and artist_tracks['tracks']:
        track = artist_tracks['tracks'][0]
    
    return track

@app.get("/top_artists_with_tracks", tags=["Spotify"])
async def top_artists_with_tracks(token: str, limit: int, time_range: str):
    sp = Spotify(auth=token)
    results = sp.current_user_top_artists(limit=limit, time_range=time_range)
    
    top_artists = results['items']

    tasks = [fetch_artist_top_track(sp, artist['id']) for artist in top_artists]
    top_tracks = await asyncio.gather(*tasks)

    for artist, track in zip(top_artists, top_tracks):
        artist['top_track'] = track

    return JSONResponse(content={'artists': top_artists})

@lru_cache(maxsize=128)
def fetch_artists_top_track(sp, artist_id):
    artist_tracks = sp.artist_top_tracks(artist_id)
    if not artist_tracks['tracks']:
        return []
    return [track for track in artist_tracks['tracks'] if track['artists'][0]['id'] == artist_id]

async def fetch_artist_top_track_for_genre(sp, artist_id, track_index):
    loop = asyncio.get_running_loop()
    artist_tracks = await loop.run_in_executor(None, fetch_artists_top_track, sp, artist_id)

    if not artist_tracks:
        return None

    normalized_index = track_index % len(artist_tracks)
    track = artist_tracks[normalized_index]

    return track['preview_url']

async def fetch_top_tracks_for_genres(sp, track_requests):
    tasks = []
    for genre, artist_id, track_index in track_requests:
        tasks.append(fetch_artist_top_track_for_genre(sp, artist_id, track_index))
    return await asyncio.gather(*tasks)

@app.get("/top_genres", tags=["Spotify"])
async def top_genres(token: str, limit: int, time_range: str):
    sp = Spotify(auth=token)
    results = sp.current_user_top_artists(limit=limit, time_range=time_range)

    genre_counts = {}
    genre_images = {}
    genre_top_tracks = {}
    genre_id_artists = {}
    genre_artists = {}
    total_genres = 0
    artist_track_indices = {}
    track_requests = []

    for artist in results['items']:
        artist_id = artist['id']
        if artist_id not in artist_track_indices:
            artist_track_indices[artist_id] = 0

        artist_image_url = artist['images'][0]['url']
        artist_name = artist['name']

        for genre in artist['genres']:
            if genre not in genre_counts:
                genre_counts[genre] = 0
                genre_images[genre] = []
                genre_top_tracks[genre] = []
                genre_id_artists[genre] = []
                genre_artists[genre] = []

            genre_counts[genre] += 1
            genre_images[genre].append(artist_image_url)
            genre_id_artists[genre].append(artist_id)
            genre_artists[genre].append(artist_name)
            total_genres += 1

            if len(genre_top_tracks[genre]) < limit:
                track_requests.append((genre, artist_id, artist_track_indices[artist_id]))
                artist_track_indices[artist_id] += 1

    # Procesar todas las solicitudes de pistas en paralelo
    track_results = await fetch_top_tracks_for_genres(sp, track_requests)

    # Asignar los resultados a los géneros correspondientes
    for (genre, _, _), track_url in zip(track_requests, track_results):
        if track_url and len(genre_top_tracks[genre]) < limit:
            genre_top_tracks[genre].append(track_url)

    sorted_genres = sorted(genre_counts.items(), key=lambda x: x[1], reverse=True)
    actual_limit = min(limit, len(sorted_genres))

    top_genres = []
    for index, (genre, count) in enumerate(sorted_genres[:actual_limit]):
        artist_count = len(genre_images[genre])
        top_genres.append({
            "id": index + 1,
            "genre": genre,
            "count": count,
            "percentage": (count / total_genres) * 100,
            "images": genre_images[genre],
            "artist_count": artist_count,
            "artist_ids": genre_id_artists[genre],
            "artists": genre_artists[genre],
            "top_tracks": genre_top_tracks[genre]
        })

    total_count_for_limit = sum(genre['count'] for genre in top_genres)
    for genre in top_genres:
        genre['percentage'] = (genre['count'] / total_count_for_limit) * 100

    return JSONResponse(content={"top_genres": top_genres})

@app.get("/current_playing_track", tags=["Spotify"])
async def current_playing_track(token: str):
    sp = Spotify(auth=token)
    results = sp.current_user_playing_track()
    return results

@app.post("/skip_to_previous_track", tags=["Spotify"])
async def skip_to_previous_track(token: str):
    sp = Spotify(auth=token)
    sp.previous_track()
    return {"message": "Skipped to Previous Track"}

@app.post("/skip_to_next_track", tags=["Spotify"])
async def skip_to_next_track(token: str):
    sp = Spotify(auth=token)
    sp.next_track()
    return {"message": "Skipped to Next Track"}

@app.post("/pause_current_track", tags=["Spotify"])
async def pause_current_track(token: str):
    sp = Spotify(auth=token)
    sp.pause_playback()
    return {"message": "Paused Current Track"}

@app.post("/resume_current_track", tags=["Spotify"])
async def resume_current_track(token: str):
    sp = Spotify(auth=token)
    sp.start_playback()
    return {"message": "Resumed Current Track"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
