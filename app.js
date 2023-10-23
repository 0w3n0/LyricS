const express = require('express');
const session = require('express-session');
const passport = require('passport');
const SpotifyStrategy = require('passport-spotify').Strategy;
const axios = require('axios');


const app = express();

app.set('view engine', 'ejs');
app.use(express.static('public'));

// Configurations de l'API Spotify
const clientId = 'd2dd99251bd9480b81222d8e8b26f6dd';
const clientSecret = 'c6948141c6814b08826dc09eda752ef3';
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
  scope: ['user-top-read']
}));

// Gérer la réponse de Spotify
app.get('/auth/spotify/callback',
  passport.authenticate('spotify', { failureRedirect: '/' }),
  function (req, res) {
    if (!req.user) {
      return res.status(401).send('Erreur d\'authentification avec Spotify');
    }
    res.redirect('/top-tracks');
  }
);

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
    res.redirect('/auth/spotify'); // Redirigez l'utilisateur vers l'authentification si ce n'est pas déjà fait
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
    res.redirect('/auth/spotify'); // Redirigez l'utilisateur vers l'authentification si ce n'est pas déjà fait
  }
}
);

app.get('/track/:id', async (req, res) => {
  if (req.isAuthenticated()) {
    const user = req.user; // Accédez aux informations de l'utilisateur à partir de req.user
    const accessToken = user.accessToken; // Exemple : Accédez à l'accessToken de l'utilisateur
    const trackId = req.params.id; // Récupérez l'ID du morceau depuis les paramètres de l'URL

    if (req.user && req.user.accessToken) {
      try {
        const [trackDatas] = await Promise.all([
          axios.get(`https://api.spotify.com/v1/tracks/${trackId}`, {
            headers: {
              'Authorization': `Bearer ${req.user.accessToken}`
            }
          })
        ]);

        const trackDatasInfos = trackDatas.data;
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

        res.render('trackDetails', { trackDatasInfos });
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
    res.redirect('/auth/spotify'); // Redirigez l'utilisateur vers l'authentification si ce n'est pas déjà fait
  }
});


app.listen(3000, () => {
  console.log('Serveur en cours d\'exécution sur le port 3000');
});