import React, { useState } from 'react';
import axios from 'axios';
import './upload.css'; 

const SongUpload = () => {
    const [file, setFile] = useState(null);
    const [title, setTitle] = useState('');
    const [artist, setArtist] = useState('');
    const [genre, setGenre] = useState('');
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState('');

    const handleFileChange = (event) => {
        setFile(event.target.files[0]);
    };

    const handleTitleChange = (event) => {
        setTitle(event.target.value);
    };

    const handleArtistChange = (event) => {
        setArtist(event.target.value);
    };

    const handleGenreChange = (event) => {
        setGenre(event.target.value);
    };

    const handleUpload = async (event) => {
        event.preventDefault();

        if (!file || !title || !artist) {
            setMessage('Please provide all fields.');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', title);
        formData.append('artist', artist);
        if (genre) formData.append('genre', genre);

        setUploading(true);
        setMessage('Uploading song...');

        try {
            const response = await axios.post('http://localhost:8080/api/songs/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data', 
                },
            });

            setMessage('Song uploaded successfully!');
            setFile(null);
            setTitle('');
            setArtist('');
            setGenre('');
        } catch (error) {
            console.error('Error uploading song:', error);
            setMessage('Failed to upload song.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="song-upload-container">
            <div>
            <h2>Upload New Song</h2>
            <form onSubmit={handleUpload}>
                <div>
                    <label>Title:</label>
                    <input
                        type="text"
                        value={title}
                        onChange={handleTitleChange}
                        required
                    />
                </div>
                <div>
                    <label>Artist:</label>
                    <input
                        type="text"
                        value={artist}
                        onChange={handleArtistChange}
                        required
                    />
                </div>
                <div>
                    <label>Genre (optional):</label>
                    <input
                        type="text"
                        value={genre}
                        onChange={handleGenreChange}
                    />
                </div>
                <div>
                    <label>Song File:</label>
                    <input
                        type="file"
                        onChange={handleFileChange}
                        accept="audio/*"
                        required
                    />
                </div>
                <div>
                    <button type="submit" disabled={uploading}>
                        {uploading ? 'Uploading...' : 'Upload Song'}
                    </button>
                </div>
            </form>
            {message && <p>{message}</p>}
        </div>
    
        </div>
        
    );
};

export default SongUpload;
