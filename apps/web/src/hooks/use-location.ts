"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

interface LocationState {
  latitude: number | null;
  longitude: number | null;
  loading: boolean;
  error: string | null;
  /** True if the user has been prompted and granted or denied */
  resolved: boolean;
  requestLocation: () => void;
}

const LocationContext = createContext<LocationState>({
  latitude: null,
  longitude: null,
  loading: false,
  error: null,
  resolved: false,
  requestLocation: () => {},
});

export { LocationContext };

export function useLocationState(): LocationState {
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resolved, setResolved] = useState(false);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported");
      setResolved(true);
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        setLoading(false);
        setResolved(true);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
        setResolved(true);
      },
      { enableHighAccuracy: false, timeout: 10000 },
    );
  }, []);

  // Auto-request on mount
  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  return { latitude, longitude, loading, error, resolved, requestLocation };
}

export function useLocation() {
  return useContext(LocationContext);
}
