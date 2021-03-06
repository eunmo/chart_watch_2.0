(function () {
  'use strict';

  module.exports = function (router, db) {
		var Songs = db.collection ('Songs');
		var Albums = db.collection ('Albums');
		var Artists = db.collection ('Artists');
		var SingleChartEntries = db.collection('SingleChartEntries');

		function getArtist (id) {
			return Artists.find ({ _id: id })
				.toArray ()
				.then (function (docs) {
					if (docs.length > 0) {
						var artist = docs[0];
						return { _id: artist._id, artist: docs[0] };
					}
					else {
						throw new Error('No Artist Found');
					}
				});
		}

		function getAlbums (artist) {
			return Albums.find ({ artists: artist._id })
				.toArray()
				.then (function (docs) {
					artist.albums = docs;
					return artist;
				});
		}

		function getAlbumSongs (artist) {
			var songIds = [];
			var album, disc, track, i, j, k;

			for (i in artist.albums) {
				album = artist.albums[i];
				for (j in album.discs) {
					disc = album.discs[j];
					if (disc) {
						for (k in disc.tracks) {
							track = disc.tracks[k];
							if (track)
								songIds.push (track);

						}
					}
				}
			}

			return Songs.find ({ _id: { $in: songIds } })
				.toArray ()
				.then (function (docs) {
					artist.albumSongs = docs;
					artist.albumSongIds = songIds;
					return artist;
				});
		}

		function getOtherSongs (artist) {
			return Songs.find ({ artists: artist._id, _id: { $nin: artist.albumSongIds } })
				.toArray ()
				.then (function (docs) {
					artist.otherSongs = docs;
					return artist;
				});
		}

		function getFeaturedSongs (artist) {
			return Songs.find ({ features: artist._id, _id: { $nin: artist.albumSongIds } })
				.toArray ()
				.then (function (docs) {
					artist.featuredSongs = docs;
					return artist;
				});
		}

		function getOtherAlbums (artist) {
			var otherSongIds = [];
			var i;

			for (i in artist.otherSongs) {
				otherSongIds.push (artist.otherSongs[i]._id);
			}

			for (i in artist.featuredSongs) {
				otherSongIds.push (artist.featuredSongs[i]._id);
			}

			return Albums.find ({ discs: { $elemMatch: { tracks: { $in: otherSongIds } } } })
				.toArray ()
				.then (function (docs) {
					artist.otherAlbums = docs;
					return artist;
				});
		}

		function getOtherAritstIdsFromSong (artist, song, arr) {
			var i, artistId;

			for (i in song.artists) {
				artistId = song.artists[i];
				if (artistId != artist._id) {
					arr.push (artistId);
				}
			}

			for (i in song.features) {
				artistId = song.features[i];
				if (artistId != artist._id) {
					arr.push (artistId);
				}
			}
		}

		function getOtherArtistsIdsFromAlbum (artist, album, arr) {
			var i, artistId;

			for (i in album.artists) {
				artistId = album.artists[i];
				if (artistId != artist._id) {
					arr.push (artistId);
				}
			}
		}

		function getOtherArtists (artist) {
			var otherArtistIds = [];
			var i, j;

			for (i in artist.albumSongs) {
				getOtherAritstIdsFromSong (artist, artist.albumSongs[i], otherArtistIds);
			}

			for (i in artist.otherSongs) {
				getOtherAritstIdsFromSong (artist, artist.otherSongs[i], otherArtistIds);
			}

			for (i in artist.featuredSongs) {
				getOtherAritstIdsFromSong (artist, artist.featuredSongs[i], otherArtistIds);
			}

			for (i in artist.albums) {
				getOtherArtistsIdsFromAlbum (artist, artist.albums[i], otherArtistIds);
			}

			for (i in artist.otherAlbums) {
				getOtherArtistsIdsFromAlbum (artist, artist.otherAlbums[i], otherArtistIds);
			}

			return Artists.find ({ _id: { $in: otherArtistIds } })
				.toArray ()
				.then (function (docs) {
					artist.otherArtists = docs;
					return artist;
				});
		}

		function replaceIds (artist) {
			var artists = [artist.artist].concat (artist.otherArtists);
			var albums = artist.albums.concat (artist.otherAlbums);
			var songs = artist.albumSongs.concat (artist.otherSongs, artist.featuredSongs);
			var i, j, k, l;
			var album, disc, song;
			var artistId, songId;

			for (i in albums) {
				album = albums[i];
				for (j in album.artists) {
					artistId = album.artists[j];
					for (k in artists) {
						if (artistId === artists[k]._id)
							album.artists[j] = Number (k);
					}
				}

				for (j in album.discs) {
					disc = album.discs[j];
					if (disc) {
						for (k in disc.tracks) {
							songId = disc.tracks[k];
							disc.tracks[k] = null;
							for (l in songs) {
								if (songId === songs[l]._id)
									disc.tracks[k] = Number (l);
							}
						}
						
						album.discs[j] = null;
						for (k in disc.tracks) {
							if (disc.tracks[k] !== null) {
								album.discs[j] = disc;
								break;
							}
						}
					}
				}
			}

			for (i in songs) {
				song = songs[i];
				for (j in song.artists) {
					artistId = song.artists[j];
					for (k in artists) {
						if (artistId === artists[k]._id)
							song.artists[j] = Number (k);
					}
				}
				
				for (j in song.features) {
					artistId = song.features[j];
					for (k in artists) {
						if (artistId === artists[k]._id)
							song.features[j] = Number (k);
					}
				}

				delete song.lastPlayed;
				delete song.bitrate;
			}

			return { artists: artists, albums: albums, songs: songs };
		}

		function getCharts (artist) {
			var songIds = [];
			var i, j, k;
			var song;

			for (i in artist.songs) {
				songIds.push (artist.songs[i]._id);
			}

			return SingleChartEntries.find ({ songs: { $in : songIds } }).toArray ()
			.then (function (docs) {
				for (i in docs) {
					var doc = docs[i];
					var rankMin = 1000;

					for (j in doc.rank) {
						var rankElem = doc.rank[j];

						if (rankElem.rank < rankMin)
							rankMin = rankElem.rank;
					}

					for (j in doc.songs) {
						for (k in artist.songs) {
							if (doc.songs[j] === artist.songs[k]._id) {
								song = artist.songs[k];
								if (song.charts === undefined)
									song.charts = [];
								song.charts.push ({ chart: doc.chart, min: rankMin });
								break;
							}
						}
					}
				}

				return artist;
			});
		}

		router.get('/artist/all_songs/:_id', function (req, res) {
			var id = Number(req.params._id);

			getArtist (id)
			.then (getAlbums)
			.then (getAlbumSongs)
			.then (getOtherSongs)
			.then (getFeaturedSongs)
			.then (getOtherAlbums)
			.then (getOtherArtists)
			.then (replaceIds)
			.then (getCharts)
			.then (function (artist) {
				res.json (artist);
			})
			.catch (function (error) {
				console.log (error);
				res.json (error);
			});
		});
	};
}());
