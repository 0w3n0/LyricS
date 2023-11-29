// playlistUtils.js

const addTracksToPlaylist = async (trackIds) => {
    try {
        // Effectuez une requête vers la route côté serveur pour vérifier l'existence de la playlist
        const response = await fetch('/check-playlist');
        const result = await response.json();

        if (result.exists) {
            // La playlist existe, vous pouvez ajouter la musique à la playlist ici
            console.log('La playlist existe, ajoutez la musique à la playlist.');
            // Ajoutez ici la logique pour ajouter la musique à la playlist existante
        } else {
            // La playlist n'existe pas, vous pouvez la créer et ajouter la musique
            console.log('La playlist n\'existe pas, créez la playlist et ajoutez la musique.');
            
            // Effectuez une nouvelle requête pour créer la playlist
            const createPlaylistResponse = await fetch('/create-playlist', { method: 'POST' });
            const createPlaylistResult = await createPlaylistResponse.json();
            console.log("résultat de createPR : " + createPlaylistResult);

            if (createPlaylistResult.success) {
                console.log('Playlist créée avec succès. Ajoutez la musique à la playlist.');
                // Ajoutez ici la logique pour ajouter la musique à la playlist nouvellement créée
            } else {
                console.error('Erreur lors de la création de la playlist :', createPlaylistResult.error);
            }
        }
        const recupDatasInsert = document.querySelector(`.recupDatasInsert`);
        const trackIdsFromElement = JSON.parse(recupDatasInsert.getAttribute('data-track-ids'));

        // Utilisez trackIds (paramètre de la fonction) plutôt que de redéclarer la variable
        // Ajoutez les pistes à la playlist
        const addTracksResponse = await fetch('/add-tracks', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ trackIds: trackIdsFromElement }),
        });
        const addTracksResult = await addTracksResponse.json();

        if (addTracksResult.success) {
        console.log('Pistes ajoutées avec succès à la playlist');
        } else {
        console.error('Erreur lors de l\'ajout des pistes à la playlist:', addTracksResult.error);
        }
    } catch (error) {
        console.error('Erreur lors de la vérification de l\'existence de la playlist :', error);
    }
};

module.exports = { addTracksToPlaylist };