// src/components/AddressAutocomplete.js
import React, { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';

const AddressAutocomplete = ({ index, address, onAddressChange }) => {
  const [apiKey, setApiKey] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const suggestionsRef = useRef(null);
  const autocompleteService = useRef(null);
  const placesService = useRef(null);

  // First, fetch the API key
  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        const response = await fetch('/api/config/maps');
        const data = await response.json();
        setApiKey(data.googleMapsApiKey);
      } catch (error) {
        console.error('Error fetching Google Maps API key:', error);
      }
    };
    fetchApiKey();
  }, []);

  // Then load the Google Maps script once we have the key
  useEffect(() => {
    if (!apiKey) return;

    if (!window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        autocompleteService.current = new window.google.maps.places.AutocompleteService();
        placesService.current = new window.google.maps.places.PlacesService(document.createElement('div'));
      };
      document.head.appendChild(script);
    } else if (window.google?.maps?.places) {
      autocompleteService.current = new window.google.maps.places.AutocompleteService();
      placesService.current = new window.google.maps.places.PlacesService(document.createElement('div'));
    }
  }, [apiKey]);

// import React, { useState, useEffect, useRef } from 'react';
// import { Loader2 } from 'lucide-react';

// const GOOGLE_API_KEY = ''; 

// const AddressAutocomplete = ({ index, address, onAddressChange }) => {
//   const [suggestions, setSuggestions] = useState([]);
//   const [showSuggestions, setShowSuggestions] = useState(false);
//   const [isLoading, setIsLoading] = useState(false);
//   const suggestionsRef = useRef(null);
//   const autocompleteService = useRef(null);
//   const placesService = useRef(null);

//   // Load Google Maps JavaScript API
//   useEffect(() => {
//     // Only load if not already loaded
//     if (!window.google) {
//       const script = document.createElement('script');
//       script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_API_KEY}&libraries=places`;
//       script.async = true;
//       script.defer = true;
//       script.onload = () => {
//         autocompleteService.current = new window.google.maps.places.AutocompleteService();
//         placesService.current = new window.google.maps.places.PlacesService(document.createElement('div'));
//       };
//       document.head.appendChild(script);
//     } else if (window.google?.maps?.places) {
//       autocompleteService.current = new window.google.maps.places.AutocompleteService();
//       placesService.current = new window.google.maps.places.PlacesService(document.createElement('div'));
//     }
//   }, []);

  const fetchAddressSuggestions = async (query) => {
    if (!query || query.length < 3 || !autocompleteService.current) return [];

    setIsLoading(true);
    try {
      const response = await new Promise((resolve, reject) => {
        autocompleteService.current.getPlacePredictions(
          {
            input: query,
            componentRestrictions: { country: 'ca' }, // Restrict to Canada
            types: ['address']
          },
          (predictions, status) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
              resolve(predictions);
            } else {
              reject(status);
            }
          }
        );
      });

      return response;
    } catch (error) {
      console.error('Error fetching address suggestions:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const getPlaceDetails = async (placeId) => {
    return new Promise((resolve, reject) => {
      placesService.current.getDetails(
        {
          placeId: placeId,
          fields: ['address_components', 'formatted_address']
        },
        (place, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK) {
            resolve(place);
          } else {
            reject(status);
          }
        }
      );
    });
  };

  const handleStreetChange = async (e) => {
    const value = e.target.value;
    onAddressChange(index, 'street', value);
    
    if (value.length >= 3) {
      const predictions = await fetchAddressSuggestions(value);
      setSuggestions(predictions);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = async (prediction) => {
    try {
      setIsLoading(true);
      const place = await getPlaceDetails(prediction.place_id);
      
      // Parse address components
      const addressData = {
        street: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'Canada'
      };

      place.address_components.forEach(component => {
        const type = component.types[0];
        if (type === 'street_number') {
          addressData.street = component.long_name + ' ';
        }
        if (type === 'route') {
          addressData.street += component.long_name;
        }
        if (type === 'locality') {
          addressData.city = component.long_name;
        }
        if (type === 'administrative_area_level_1') {
          addressData.state = component.long_name;
        }
        if (type === 'postal_code') {
          addressData.postalCode = component.long_name;
        }
      });

      // Update all address fields
      Object.keys(addressData).forEach(field => {
        onAddressChange(index, field, addressData[field]);
      });
    } catch (error) {
      console.error('Error getting place details:', error);
    } finally {
      setIsLoading(false);
      setShowSuggestions(false);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-600">Street</label>
      <input
        type="text"
        value={address.street || ''}
        onChange={handleStreetChange}
        onKeyDown={handleKeyDown}
        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
        placeholder="Start typing your street address..."
      />
      
      {/* Suggestions dropdown */}
      {showSuggestions && (suggestions.length > 0 || isLoading) && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg"
        >
          {isLoading ? (
            <div className="p-4 text-gray-500 flex items-center justify-center">
              <Loader2 className="animate-spin h-5 w-5 mr-2" />
              <span>Loading suggestions...</span>
            </div>
          ) : (
            <ul className="max-h-60 overflow-auto py-1">
              {suggestions.map((suggestion) => (
                <li
                  key={suggestion.place_id}
                  className="px-4 py-2 hover:bg-blue-50 cursor-pointer transition-colors"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  <div className="font-medium">{suggestion.structured_formatting.main_text}</div>
                  <div className="text-sm text-gray-500">
                    {suggestion.structured_formatting.secondary_text}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default AddressAutocomplete;