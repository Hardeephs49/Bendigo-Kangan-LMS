import React, { useState, useCallback } from 'react';
import {
  Box,
  Container,
  TextField,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Grid,
  IconButton,
  InputAdornment,
  CircularProgress,
  Tabs,
  Tab,
  Alert,
} from '@mui/material';
import {
  Search as SearchIcon,
  LocationOn,
  Directions,
} from '@mui/icons-material';
import Map, {
  Marker,
  Popup,
  NavigationControl,
  FullscreenControl,
  ScaleControl,
  GeolocateControl,
  ViewState,
  ViewStateChangeEvent,
} from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Map initial state with padding
const initialViewState: ViewState = {
  latitude: -36.756700, // Central point for Bendigo TAFE campus from the image
  longitude: 144.284000,
  zoom: 16,
  bearing: 0,
  pitch: 0,
  padding: { top: 0, bottom: 0, left: 0, right: 0 },
};

// Bendigo TAFE Campus locations
const locations = [
  { id: 1, name: 'Main Building', category: 'Academic', coordinates: { lat: -36.757335, lng: 144.283283 }, description: 'Main academic building with classrooms and offices' },
  { id: 2, name: 'Bendigo Law Court', category: 'Legal', coordinates: { lat: -36.757259, lng: 144.283499 }, description: 'Bendigo Law Court' },
  { id: 3, name: 'Information Center Library', category: 'Academic', coordinates: { lat: -36.756969, lng: 144.284011 }, description: 'Information Center Library' },
  { id: 4, name: 'Pathology', category: 'Medical', coordinates: { lat: -36.755789, lng: 144.28421 }, description: 'Pathology' },
  { id: 5, name: 'MacGillivray Hall', category: 'Academic', coordinates: { lat: -36.756759, lng: 144.283402 }, description: 'MacGillivray Hall' },
  { id: 6, name: 'Library', category: 'Academic', coordinates: { lat: -36.756146, lng: 144.284025 }, description: 'Library' },
];

const Navigation: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<number | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [viewState, setViewState] = useState<ViewState>(initialViewState);
  const [selectedTafbMap, setSelectedTafbMap] = useState<'bendigo' | 'kangan'>('bendigo');
  const [selectedKanganLevel, setSelectedKanganLevel] = useState<string>('ground-floor');

  const mapboxApiAccessToken = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;

  const filteredLocations = locations.filter(location =>
    location.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    location.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const flyToLocation = useCallback((latitude: number, longitude: number) => {
    setViewState(current => ({
      ...current,
      latitude,
      longitude,
      zoom: 18,
      transitionDuration: 1000,
    }));
  }, []);

  const handleLocationClick = (locationId: number) => {
    setSelectedLocation(locationId);
    const location = locations.find(loc => loc.id === locationId);
    if (location) {
      flyToLocation(location.coordinates.lat, location.coordinates.lng);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4, paddingTop: '60px' }}>
      <Typography variant="h4" gutterBottom sx={{ marginBottom: '20px' }}>Campus Navigation</Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search locations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 2 }}
            />
            <List>
              {filteredLocations.map((location) => (
                <ListItem
                  key={location.id}
                  button
                  selected={selectedLocation === location.id}
                  onClick={() => handleLocationClick(location.id)}
                >
                  <ListItemIcon><LocationOn color="primary" /></ListItemIcon>
                  <ListItemText primary={location.name} secondary={location.category} />
                  <IconButton size="small" onClick={(e) => e.stopPropagation()}><Directions /></IconButton>
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, height: '400px' }}>
            {!mapboxApiAccessToken ? (
              <Alert severity="error">Mapbox Access Token missing!</Alert>
            ) : (
              <Map
                mapboxAccessToken={mapboxApiAccessToken}
                {...viewState}
                onMove={(evt: ViewStateChangeEvent) => setViewState(evt.viewState)}
                mapStyle="mapbox://styles/mapbox/streets-v11"
                style={{ width: '100%', height: '100%' }}
              >
                <NavigationControl />
                <FullscreenControl />
                <ScaleControl />
                <GeolocateControl
                  trackUserLocation={true}
                  onGeolocate={(pos) => {
                    setUserLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
                  }}
                />
                {locations.map(location => (
                  <Marker
                    key={location.id}
                    latitude={location.coordinates.lat}
                    longitude={location.coordinates.lng}
                    onClick={() => setSelectedLocation(location.id)}
                  />
                ))}
                {userLocation && (
                  <Marker
                    latitude={userLocation.latitude}
                    longitude={userLocation.longitude}
                    color="blue"
                  />
                )}
                {selectedLocation && (
                  <Popup
                    latitude={locations.find(loc => loc.id === selectedLocation)?.coordinates.lat || 0}
                    longitude={locations.find(loc => loc.id === selectedLocation)?.coordinates.lng || 0}
                    onClose={() => setSelectedLocation(null)}
                  >
                    <Typography variant="subtitle1">
                      {locations.find(loc => loc.id === selectedLocation)?.name}
                    </Typography>
                    <Typography variant="body2">
                      {locations.find(loc => loc.id === selectedLocation)?.description}
                    </Typography>
                  </Popup>
                )}
              </Map>
            )}
          </Paper>
        </Grid>
      </Grid>
      <Box sx={{ py: 4, mt: 4, textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom>Internal Maps</Typography>
        <Tabs value={selectedTafbMap} onChange={(e, newValue) => setSelectedTafbMap(newValue)} centered>
          <Tab label="Bendigo TAFE" value="bendigo" />
          <Tab label="Kangan TAFE" value="kangan" />
        </Tabs>
        <Box sx={{ mt: 2 }}>
          {selectedTafbMap === 'bendigo' && (
            <Box>
              <Typography variant="h5" gutterBottom>Bendigo TAFE Map</Typography>
              <img src="/images/bendigo TAFE.png" alt="Bendigo TAFE Internal Map" style={{ maxWidth: '100%', height: 'auto' }} />
            </Box>
          )}
          {selectedTafbMap === 'kangan' && (
            <Box>
              <Typography variant="h5" gutterBottom>Kangan TAFE Internal Maps</Typography>
              <Tabs value={selectedKanganLevel} onChange={(e, newValue) => setSelectedKanganLevel(newValue)} centered>
                <Tab label="Ground Floor" value="ground-floor" />
                <Tab label="Level 1" value="level-1" />
                <Tab label="Level 2" value="level-2" />
                <Tab label="Level 3" value="level-3" />
              </Tabs>
              <Box sx={{ mt: 2 }}>
                {selectedKanganLevel === 'ground-floor' && <img src="/images/ground-floor.png" alt="Kangan TAFE Ground Floor" style={{ maxWidth: '100%', height: 'auto' }} />}
                {selectedKanganLevel === 'level-1' && <img src="/images/level-1.png" alt="Kangan TAFE Level 1" style={{ maxWidth: '100%', height: 'auto' }} />}
                {selectedKanganLevel === 'level-2' && <img src="/images/level-2.png" alt="Kangan TAFE Level 2" style={{ maxWidth: '100%', height: 'auto' }} />}
                {selectedKanganLevel === 'level-3' && <img src="/images/level-3.png" alt="Kangan TAFE Level 3" style={{ maxWidth: '100%', height: 'auto' }} />}
              </Box>
            </Box>
          )}
        </Box>
      </Box>
    </Container>
  );
};

export default Navigation;
