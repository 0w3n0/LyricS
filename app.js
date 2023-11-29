const express = require('express');
const session = require('express-session');
const passport = require('passport');
const SpotifyStrategy = require('passport-spotify').Strategy;
const axios = require('axios');


const app = express();

app.set('view engine', 'ejs');
app.use(express.static('public'));

app.use(express.json());

// Configurations de l'API Spotify
const clientId = 'd2dd99251bd9480b81222d8e8b26f6dd'; // LyricS
// const clientId = '862c7dacc1604e9db43fc7bcf899ca4c'; // LyricS BP
const clientSecret = 'c6948141c6814b08826dc09eda752ef3';  // LyricS
// const clientSecret = 'cb373d236ee7436aedddcfbabdd9d9e';  // LyricS BP

const redirectUri = 'http://localhost:3000/auth/spotify/callback';

app.get('/', (req, res) => {
  res.render('home');
});

// Ajouter cette ligne pour configurer express-session
app.use(session({ secret: clientSecret, resave: true, saveUninitialized: true }));

// Ajoutez cette ligne pour configurer Passport avec express-session
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (user, done) {
  done(null, user);
});

// Configurer passport avec la stratégie Spotify
passport.use(new SpotifyStrategy({
  clientID: clientId,
  clientSecret: clientSecret,
  callbackURL: redirectUri
},
  function (accessToken, refreshToken, expires_in, profile, done) {
    // Ici, vous pouvez enregistrer les informations de l'utilisateur ou faire autre chose avec les données

    // Exemple d'enregistrement des informations de l'utilisateur
    const user = {
      id: profile.id, // Identifiant unique de l'utilisateur
      displayName: profile.displayName, // Nom d'affichage de l'utilisateur
      accessToken: accessToken, // Token d'accès à Spotify
      refreshToken: refreshToken, // Token de rafraîchissement pour obtenir un nouveau token d'accès
      expires_in: expires_in // Durée de validité du token d'accès
    };

    // Enregistrez l'utilisateur dans votre base de données ou faites toute autre opération nécessaire
    // Assurez-vous d'appeler done() pour indiquer que le processus d'authentification est terminé.
    return done(null, user);
  }
));

// Rediriger l'utilisateur vers l'authentification Spotify
app.get('/auth/spotify', passport.authenticate('spotify', {
  scope: ['user-top-read', 'user-follow-read', 'playlist-modify-private', 'playlist-read-private']
}));

// Gérer la réponse de Spotify
app.get('/auth/spotify/callback',
  passport.authenticate('spotify', { failureRedirect: '/' }),
  function (req, res) {
    if (!req.user) {
      return res.status(401).send('Erreur d\'authentification avec Spotify');
    }
    res.redirect('/home');
  }
);

app.get('/logout', function (req, res, next) {
  if (req.isAuthenticated()) {
    req.logout(function (err) {
      if (err) { return next(err); }
      res.redirect('/');
    });
  }
  else {
    res.redirect("/");
  }
});

// Récupération des 10 titres les plus écoutés
app.get('/top-tracks', async (req, res) => {
  if (req.isAuthenticated()) {
    const user = req.user; // Accédez aux informations de l'utilisateur à partir de req.user
    const accessToken = user.accessToken; // Exemple : Accédez à l'accessToken de l'utilisateur
    if (req.user && req.user.accessToken) {
      try {
        const [recentResponse, MidTermResponse, longTermResponse] = await Promise.all([
          axios.get('https://api.spotify.com/v1/me/top/tracks?time_range=short_term', {
            headers: {
              'Authorization': `Bearer ${req.user.accessToken}`
            }
          }),
          axios.get('https://api.spotify.com/v1/me/top/tracks?time_range=medium_term', {
            headers: {
              'Authorization': `Bearer ${req.user.accessToken}`
            }
          }),

          axios.get('https://api.spotify.com/v1/me/top/tracks?time_range=long_term', {
            headers: {
              'Authorization': `Bearer ${req.user.accessToken}`
            }
          })
        ]);

        const recentTopTracks = recentResponse.data.items;
        const MidTermTopTracks = MidTermResponse.data.items;
        const longTermTopTracks = longTermResponse.data.items;
        const displayName = user.displayName;

        axios.get('https://api.spotify.com/v1/me', {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        })
          .then(response => {
            const displayName = response.data.display_name;
            console.log('Pseudonyme de l\'utilisateur :', displayName);
          })
          .catch(error => {
            console.error('Erreur lors de la récupération du pseudonyme de l\'utilisateur :', error);
          });

        res.render('topTracks', { recentTopTracks, MidTermTopTracks, longTermTopTracks, displayName });
      } catch (error) {
        console.error('Erreur lors de la récupération des données Spotify:', error);
        res.status(500).send('Erreur lors de la récupération des données Spotify');
      }
    }

    else {
      console.log("Access Token:", req.user.accessToken, "<br/><br/><br/><br/><br/><br/><br/><br/>"); // Ajout de cette ligne

      console.error("Erreur: Access Token non disponible");
      res.status(401).send("Erreur: Accès non autorisé");
    }
  }
  else {
    res.redirect('/'); // Redirigez l'utilisateur vers l'authentification si ce n'est pas déjà fait
  }
}
);

// Récupération des 10 titres les plus écoutés
app.get('/top-artists', async (req, res) => {
  if (req.isAuthenticated()) {
    const user = req.user; // Accédez aux informations de l'utilisateur à partir de req.user
    const accessToken = user.accessToken; // Exemple : Accédez à l'accessToken de l'utilisateur
    if (req.user && req.user.accessToken) {
      try {
        const [recentResponse, MidTermResponse, longTermResponse] = await Promise.all([
          axios.get('https://api.spotify.com/v1/me/top/artists?time_range=short_term', {
            headers: {
              'Authorization': `Bearer ${req.user.accessToken}`
            }
          }),
          axios.get('https://api.spotify.com/v1/me/top/artists?time_range=medium_term', {
            headers: {
              'Authorization': `Bearer ${req.user.accessToken}`
            }
          }),

          axios.get('https://api.spotify.com/v1/me/top/artists?time_range=long_term', {
            headers: {
              'Authorization': `Bearer ${req.user.accessToken}`
            }
          })
        ]);

        const recentTopArtists = recentResponse.data.items;
        const MidTermTopArtists = MidTermResponse.data.items;
        const longTermTopArtists = longTermResponse.data.items;
        const displayName = user.displayName;

        axios.get('https://api.spotify.com/v1/me', {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        })
          .then(response => {
            const displayName = response.data.display_name;
            console.log('Pseudonyme de l\'utilisateur :', displayName);
          })
          .catch(error => {
            console.error('Erreur lors de la récupération du pseudonyme de l\'utilisateur :', error);
          });

        res.render('topArtists', { recentTopArtists, MidTermTopArtists, longTermTopArtists, displayName });
      } catch (error) {
        console.error('Erreur lors de la récupération des données Spotify:', error);
        res.status(500).send('Erreur lors de la récupération des données Spotify');
      }
    }

    else {
      console.log("Access Token:", req.user.accessToken, "<br/><br/><br/><br/><br/><br/><br/><br/>"); // Ajout de cette ligne

      console.error("Erreur: Access Token non disponible");
      res.status(401).send("Erreur: Accès non autorisé");
    }
  }
  else {
    res.redirect('/'); // Redirigez l'utilisateur vers l'authentification si ce n'est pas déjà fait
  }
}
);

app.get('/search', async (req, res) => {
  if (req.isAuthenticated()) {
    const user = req.user; // Accédez aux informations de l'utilisateur à partir de req.user
    const accessToken = user.accessToken; // Exemple : Accédez à l'accessToken de l'utilisateur
    if (req.user && req.user.accessToken) {
      try {
        // const apiUrl = `https://api.spotify.com/v1/search?q=${query}&type=track,artist&limit=10&market=FR`;

        // const [searchResponse] = await Promise.all([
        //   axios.get(apiUrl, {
        //     headers: {
        //       'Authorization': `Bearer ${accessToken}`
        //     }
        //   })
        // ]);

        const displayName = user.displayName;

        axios.get('https://api.spotify.com/v1/me', {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        })
          .then(response => {
            const displayName = response.data.display_name;
            console.log('Pseudonyme de l\'utilisateur :', displayName);
          })
          .catch(error => {
            console.error('Erreur lors de la récupération du pseudonyme de l\'utilisateur :', error);
          });

        res.render('search', { displayName, accessToken });
      } catch (error) {
        console.error('Erreur lors de la récupération des données Spotify:', error);
        res.status(500).send('Erreur lors de la récupération des données Spotify');
      }
    }

    else {
      console.log("Access Token:", req.user.accessToken, "<br/><br/><br/><br/><br/><br/><br/><br/>"); // Ajout de cette ligne

      console.error("Erreur: Access Token non disponible");
      res.status(401).send("Erreur: Accès non autorisé");
    }
  }
  else {
    res.redirect('/'); // Redirigez l'utilisateur vers l'authentification si ce n'est pas déjà fait
  }
}
);
// truc où les artistes sont 2 fois dedans et
app.get('/radar', async (req, res) => {
  if (req.isAuthenticated()) {
    const user = req.user;
    const accessToken = user.accessToken;

    if (req.user && req.user.accessToken) {
      try {
        // Récupérer la date d'aujourd'hui
        const currentDate = new Date();

        // Définir l'heure, les minutes, les secondes et les millisecondes à 0
        currentDate.setHours(0, 3, 0, 0);

        // Récupérer le jour de la semaine (0 pour dimanche, 1 pour lundi, ..., 6 pour samedi)
        const currentDay = currentDate.getDay();

        // Si aujourd'hui est vendredi (jour de la semaine = 5), ajuster la date de fin et de début
        let startDate = new Date(currentDate);
        let endDate = new Date(currentDate);

        if (currentDay === 5) {
          // Si aujourd'hui est vendredi, ajuster la date de fin à aujourd'hui et la date de début à il y a 7 jours
          startDate.setDate(startDate.getDate() - 8);
        } else {
          // Sinon, ajuster la date de fin au prochain vendredi et la date de début à vendredi - 7 jours
          endDate.setDate(endDate.getDate() + ((5 - currentDay + 7) % 7) - 6);
          startDate.setDate(startDate.getDate() + ((5 - currentDay + 7) % 7) - 15);
        }

        console.log(`ça commence à ${startDate} et termine à ${endDate}`);

        const allFollowedArtists = await getAllFollowedArtists(accessToken);

        // Filtrer les artistes pour ne montrer qu'une seule occurrence de chaque artiste
        const uniqueFollowedArtists = Array.from(new Set(allFollowedArtists.map(artist => artist.id)))
          .map(artistId => allFollowedArtists.find(artist => artist.id === artistId));

        console.log('Noms des artistes suivis :', uniqueFollowedArtists.map(artist => artist.name));

        const albumsByArtist = await Promise.all(uniqueFollowedArtists.map(artist =>
          getRecentReleasesForArtist(accessToken, artist.id)
        ));

        // Ajoutez les trackIds à chaque album
        albumsByArtist.forEach(artistAlbums => {
          artistAlbums.forEach(album => {
            album.trackIds = album.tracks.map(track => track.id);
          });
        });

        console.log('Noms des artistes dans albumsByArtist :', albumsByArtist.map(artistAlbums => artistAlbums.length > 0 ? artistAlbums[0].artists[0].name : 'Aucun album trouvé'));
        console.log('Liste complète des artistes suivis :', albumsByArtist);
        res.render('radarManager', { albumsByArtist, displayName: user.displayName });
      } catch (error) {
        console.error('Erreur lors de la récupération des données Spotify:', error);
        res.status(500).send('Erreur lors de la récupération des données Spotify');
      }
    } else {
      console.error("Erreur: Access Token non disponible");
      res.status(401).send("Erreur: Accès non autorisé");
    }
  } else {
    res.redirect('/');
  }
});

const getAllFollowedArtists = async (accessToken) => {
  const limit = 50; // Nombre d'artistes à récupérer par page (maximum 50)
  let offset = 0;
  let allArtists = [];

  // Utilisez une boucle pour paginer à travers les résultats
  while (offset < 100) {
    const response = await axios.get('https://api.spotify.com/v1/me/following', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      params: {
        type: 'artist',
        limit: limit,
        offset: offset
      }
    });

    const artists = response.data.artists.items;

    if (artists.length === 0) {
      // Aucun artiste trouvé, sortez de la boucle
      break;
    }

    // Ajoutez les artistes de la page actuelle à la liste globale
    allArtists = allArtists.concat(artists);

    // Incrémentez l'offset pour obtenir la page suivante
    offset += limit;
  }
  return allArtists;
};

const getRecentReleasesForArtist = async (accessToken, artistId) => {
  try {
    const response = await axios.get(`https://api.spotify.com/v1/artists/${artistId}/albums`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      params: {
        include_groups: 'album,single,appears_on',
        limit: 10, // Vous pouvez ajuster la limite selon vos besoins
        market: 'from_token' // Pour obtenir les sorties disponibles dans le pays de l'utilisateur
      }
    });

    const releases = response.data.items;

    // Filtrer les sorties pour inclure uniquement celles qui ont été ajoutées récemment
    const currentDate = new Date();
    const recentReleases = releases.filter(release => {
      const releaseDate = new Date(release.release_date);
      const daysAgo = Math.floor((currentDate - releaseDate) / (1000 * 60 * 60 * 24));
      return daysAgo <= 30; // Vous pouvez ajuster la période de temps selon vos besoins
    });

    // Ajouter les détails des pistes à chaque sortie
    const releasesWithTracks = await Promise.all(recentReleases.map(async release => {
      try {
        const tracksResponse = await axios.get(`https://api.spotify.com/v1/albums/${release.id}/tracks?limit=50`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });
        release.tracks = tracksResponse.data.items;
      } catch (error) {
        console.error(`Erreur lors de la récupération des pistes pour la sortie ${release.name}:`, error);
      }
      return release;
    }));

    return releasesWithTracks;
  } catch (error) {
    console.error('Erreur lors de la récupération des sorties pour l\'artiste:', error);
    throw error; // Propagez l'erreur pour la gérer en aval
  }
};

// Ajoutez une route pour ajouter un album à la playlist
app.post('/add-album-to-playlist', async (req, res) => {

  const accessToken = req.user.accessToken;

  try {

    const albumId = req.body.albumId;
    const playlistId = req.body.playlistId;


    // Obtenez les pistes de l'album
    const albumTracks = await getAlbumTracks(albumId, accessToken);

    // Obtenez les URI des pistes
    const trackUris = albumTracks.map(track => track.uri);

    // Ajoutez les pistes à la playlist en utilisant Axios
    const addTracksToPlaylistResponse = await axios.post(
      `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
      { uris: trackUris },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('Album ajouté à la playlist : ', addTracksToPlaylistResponse.data);
    res.send('Album ajouté à la playlist!');
  } catch (error) {
    console.error('Erreur lors de l\'ajout de l\'album à la playlist : ', error);
    res.status(500).send('Erreur lors de l\'ajout de l\'album à la playlist.');
  }
});

// Fonction pour obtenir les pistes d'un album
async function getAlbumTracks(albumId, accessToken) {
  try {
    // Utilisez Axios pour appeler l'API Spotify et obtenir les pistes de l'album
    const response = await axios.get(`https://api.spotify.com/v1/albums/${albumId}/tracks`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    return response.data.items;
  } catch (error) {
    console.error('Erreur lors de la récupération des pistes de l\'album : ', error);
    throw error;
  }
}

app.get('/check-playlist', async (req, res) => {
  try {
    const accessToken = req.user.accessToken;

    // Vérifiez l'existence de la playlist "LyricS Playlist"
    const lyricSPlaylistExists = await checkLyricSPlaylist(accessToken);

    // Répondez avec l'état d'existence de la playlist
    res.json({ exists: lyricSPlaylistExists });
  } catch (error) {
    console.error('Erreur lors de la vérification de l\'existence de la playlist "LyricS Playlist" :', error);
    res.status(500).json({ exists: false, error: 'Erreur lors de la vérification de l\'existence de la playlist "LyricS Playlist"' });
  }
});

// Fonction pour vérifier l'existence de la playlist "LyricS Playlist"
const checkLyricSPlaylist = async (accessToken) => {
  try {
    const response = await axios.get(`https://api.spotify.com/v1/me/playlists?limit=50`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    const playlists = response.data.items;
    console.log(playlists);

    // Vérifiez si la playlist "LyricS Playlist" existe
    return playlists.find(playlist => playlist.name === 'LyricS Playlist');
  } catch (error) {
    console.error('Erreur lors de la création de la playlist "LyricS Playlist" :', error.response?.data || error.message);
    throw error;
  }
};

app.post('/create-playlist', async (req, res) => {
  console.log('Requête POST reçue pour la création de playlist');
  try {
    const accessToken = req.user.accessToken;

    // Créez la playlist "LyricS Playlist"
    const createdPlaylist = await createLyricSPlaylist(accessToken);

    // Répondez avec le résultat de la création de la playlist
    res.json({ success: true, playlist: createdPlaylist });
  } catch (error) {
    console.error('Erreur lors de la création de la playlist "LyricS Playlist" :', error);
    res.status(500).json({ success: false, error: 'Erreur lors de la création de la playlist "LyricS Playlist"', details: error.message });
  }
});

const createLyricSPlaylist = async (accessToken) => {
  try {
    const userId = await getUserId(accessToken);
    console.log("USERID post = " + userId);

    const response = await axios.post(`https://api.spotify.com/v1/users/${userId}/playlists`, {
      name: 'LyricS Playlist',
      description: 'Nouvelles sorties LyricS',
      public: false
    }, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data;
  } catch (error) {
    console.error('Erreur lors de la création de la playlist "LyricS Playlist" :', error);
    throw error;
  }
};

const getUserId = async (accessToken) => {
  try {
    const response = await axios.get('https://api.spotify.com/v1/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    console.log(response.data.id);
    return response.data.id;
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'ID de l\'utilisateur :', error);
    throw error;
  }
};

// app.post('/add-tracks', async (req, res) => {
//   console.log('Requête POST reçue pour l\'ajout de pistes à la playlist');

//   try {
//     // Récupérer les données de la requête
//     const { trackIds } = req.body;
//     const accessToken = req.user.accessToken;

//     // Appeler une fonction pour ajouter les pistes à la playlist Spotify
//     await addTracksToPlaylist(accessToken, trackIds);

//     // Répondre avec succès
//     res.json({ success: true });
//   } catch (error) {
//     console.error('Erreur lors de l\'ajout de pistes à la playlist :', error);
//     res.status(500).json({ success: false, error: 'Erreur lors de l\'ajout de pistes à la playlist', details: error.message });
//   }
// });

// const addTracksToPlaylist = async (accessToken, trackIds) => {
//   try {
//     // Effectuez une requête vers la route côté serveur pour vérifier l'existence de la playlist
//     const response = await fetch(`/check-playlist`);
//     const result = await response.json();

//     if (result.exists) {
//       // La playlist existe, vous pouvez ajouter la musique à la playlist ici
//       console.log('La playlist existe, ajoutez la musique à la playlist.');
//       // Ajoutez ici la logique pour ajouter la musique à la playlist existante

//       const playlistId = result.id;
//       console.log(playlistId);
//     } else {
//       // La playlist n'existe pas, vous pouvez la créer et ajouter la musique
//       console.log('La playlist n\'existe pas, créez la playlist et ajoutez la musique.');

//       // Effectuez une nouvelle requête pour créer la playlist
//       const createPlaylistResponse = await fetch('/create-playlist', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({ playlistId }),
//       });

//       const createPlaylistResult = await createPlaylistResponse.json();

//       if (createPlaylistResult.success) {
//         console.log('Playlist créée avec succès. Ajoutez la musique à la playlist.');
//         // Ajoutez ici la logique pour ajouter la musique à la playlist nouvellement créée
//       } else {
//         console.error('Erreur lors de la création de la playlist :', createPlaylistResult.error);
//       }
//     }
//   } catch (error) {
//     console.error('Erreur lors de la vérification de l\'existence de la playlist :', error);
//   }
// };

app.get('/track/:id', async (req, res) => {
  if (req.isAuthenticated()) {
    const user = req.user; // Accédez aux informations de l'utilisateur à partir de req.user
    const accessToken = user.accessToken; // Exemple : Accédez à l'accessToken de l'utilisateur
    const trackId = req.params.id; // Récupérez l'ID du morceau depuis les paramètres de l'URL

    if (req.user && req.user.accessToken) {
      try {
        const [trackDatas, recommendationsResponse] = await Promise.all([
          axios.get(`https://api.spotify.com/v1/tracks/${trackId}`, {
            headers: {
              'Authorization': `Bearer ${req.user.accessToken}`
            }
          }),
          axios.get(`https://api.spotify.com/v1/recommendations?seed_tracks=${trackId}`, {
            headers: {
              'Authorization': `Bearer ${req.user.accessToken}`
            }
          })
        ]);

        const trackDatasInfos = trackDatas.data;
        const displayName = user.displayName;
        const recommendedTracks = recommendationsResponse.data.tracks;

        axios.get('https://api.spotify.com/v1/me', {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        })
          .then(response => {
            const displayName = response.data.display_name;
            console.log('Pseudonyme de l\'utilisateur :', displayName);
          })
          .catch(error => {
            console.error('Erreur lors de la récupération du pseudonyme de l\'utilisateur :', error);
          });

        res.render('trackDetails', { trackDatasInfos, recommendedTracks, displayName });
      } catch (error) {
        if (error.response && error.response.status === 429) {
          // L'erreur est due à trop de requêtes, vérifions s'il y a un délai recommandé
          const retryAfter = error.response.headers['retry-after'];

          if (retryAfter) {
            // Attendre le temps recommandé avant de réessayer
            console.log(`Trop de requêtes. Attendez ${retryAfter} secondes.`);
            await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));

            // Réessayer la requête
            // ...
          }
        } else {
          // Gérer d'autres types d'erreurs
          console.error('Erreur lors de la récupération des données Spotify:', error);
          res.status(500).send('Erreur lors de la récupération des données Spotify');
        }

      }
    }

    else {
      console.log("Access Token:", req.user.accessToken, "<br/><br/><br/><br/><br/><br/><br/><br/>"); // Ajout de cette ligne

      console.error("Erreur: Access Token non disponible");
      res.status(401).send("Erreur: Accès non autorisé");
    }
  }
  else {
    res.redirect('/'); // Redirigez l'utilisateur vers l'authentification si ce n'est pas déjà fait
  }
});

// Récupération des 10 titres les plus écoutés
app.get('/home', async (req, res) => {
  if (req.isAuthenticated()) {
    const user = req.user; // Accédez aux informations de l'utilisateur à partir de req.user
    const accessToken = user.accessToken; // Exemple : Accédez à l'accessToken de l'utilisateur
    if (req.user && req.user.accessToken) {
      try {
        const [Home_infos_artists, Home_infos_tracks] = await Promise.all([
          axios.get('https://api.spotify.com/v1/me/top/artists?time_range=short_term&limit=5', {
            headers: {
              'Authorization': `Bearer ${req.user.accessToken}`
            }
          }),

          axios.get('https://api.spotify.com/v1/me/top/tracks?time_range=short_term&limit=5', {
            headers: {
              'Authorization': `Bearer ${req.user.accessToken}`
            }
          })
        ]);

        const Home_infos_artists_datas = Home_infos_artists.data.items;
        const Home_infos_tracks_datas = Home_infos_tracks.data.items;
        const displayName = user.displayName;

        axios.get('https://api.spotify.com/v1/me', {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        })
          .then(response => {
            const displayName = response.data.display_name;
            console.log('Pseudonyme de l\'utilisateur :', displayName);
          })
          .catch(error => {
            console.error('Erreur lors de la récupération du pseudonyme de l\'utilisateur :', error);
          });

        res.render('index', { Home_infos_artists_datas, Home_infos_tracks_datas, displayName });
      } catch (error) {
        console.error('Erreur lors de la récupération des données Spotify:', error);
        res.status(500).send('Erreur lors de la récupération des données Spotify');
      }
    }

    else {
      console.log("Access Token:", req.user.accessToken, "<br/><br/><br/><br/><br/><br/><br/><br/>"); // Ajout de cette ligne

      console.error("Erreur: Access Token non disponible");
      res.status(401).send("Erreur: Accès non autorisé");
    }
  }
  else {
    res.redirect('/'); // Redirigez l'utilisateur vers l'authentification si ce n'est pas déjà fait
  }
}
);

app.get('/artist/:id', async (req, res) => {
  if (req.isAuthenticated()) {
    const user = req.user;
    const accessToken = user.accessToken;
    const artistId = req.params.id;

    if (req.user && req.user.accessToken) {
      try {
        const [ArtistInfosResponse, ArtistrecommendationsResponse, ArtistTopTracksResponse] = await Promise.all([
          axios.get(`https://api.spotify.com/v1/artists/${artistId}`, {
            headers: {
              'Authorization': `Bearer ${req.user.accessToken}`
            }
          }),
          axios.get(`https://api.spotify.com/v1/artists/${artistId}/related-artists`, {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          }),
          axios.get(`https://api.spotify.com/v1/artists/${artistId}/top-tracks?market=FR`, {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          })
        ]);

        const ArtistInfos = ArtistInfosResponse.data;
        const TopTracks = ArtistTopTracksResponse.data;
        const recommendationArtists = ArtistrecommendationsResponse.data;
        const displayName = user.displayName;
        console.log(TopTracks);

        res.render('artistDetails', { ArtistInfos, recommendationArtists, TopTracks, displayName });
      } catch (error) {
        console.error('Erreur lors de la récupération des top tracks de l\'artiste:', error);
        res.status(500).send('Erreur lors de la récupération des top tracks de l\'artiste');
      }
    } else {
      console.error("Erreur: Access Token non disponible");
      res.status(401).send("Erreur: Accès non autorisé");
    }
  } else {
    res.redirect('/'); // Redirigez l'utilisateur vers l'authentification si ce n'est pas déjà fait
  }
});





app.listen(3000, () => {
  console.log('Serveur en cours d\'exécution sur le port 3000');
});
