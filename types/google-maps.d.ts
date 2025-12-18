declare global {
  namespace google {
    namespace maps {
      interface MapOptions {
        center?: LatLng | LatLngLiteral;
        zoom?: number;
        mapTypeControl?: boolean;
        streetViewControl?: boolean;
        fullscreenControl?: boolean;
      }

      interface MarkerOptions {
        position?: LatLng | LatLngLiteral;
        map?: Map;
        title?: string;
      }

      class Map {
        constructor(mapDiv: HTMLElement, opts?: MapOptions);
        setCenter(center: LatLng | LatLngLiteral): void;
      }

      class Marker {
        constructor(opts?: MarkerOptions);
        setMap(map: Map | null): void;
        setPosition(position: LatLng | LatLngLiteral): void;
      }

      interface LatLngLiteral {
        lat: number;
        lng: number;
      }

      class LatLng {
        constructor(lat: number, lng: number);
        lat(): number;
        lng(): number;
      }

      namespace places {
        interface AutocompleteOptions {
          types?: string[];
          fields?: string[];
        }

        class Autocomplete {
          constructor(inputField: HTMLInputElement, opts?: AutocompleteOptions);
          addListener(eventName: string, handler: () => void): void;
          getPlace(): any;
        }
      }

      namespace event {
        function clearInstanceListeners(instance: any): void;
      }
    }
  }

  interface Window {
    google: typeof google;
  }
}
