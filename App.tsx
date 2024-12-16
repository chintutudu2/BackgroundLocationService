import {View, Text, SafeAreaView} from 'react-native';
import React, {useEffect, useState} from 'react';
import Geolocation from 'react-native-geolocation-service';
import {
  accelerometer,
  SensorTypes,
  setUpdateIntervalForType,
} from 'react-native-sensors';

// Set the update interval for the accelerometer
setUpdateIntervalForType(SensorTypes.accelerometer, 2000);

const App = () => {
  let isMoving = false;
  let lastLocation: any = null;

  const [location, setLocation] = useState<any>();

  // Helper function to calculate distance between two coordinates
  const calculateDistance = (lat1: any, lon1: any, lat2: any, lon2: any) => {
    const toRad = (value: any) => (value * Math.PI) / 180;
    const R = 6371e3; // Earth's radius in meters
    const φ1 = toRad(lat1);
    const φ2 = toRad(lat2);
    const Δφ = toRad(lat2 - lat1);
    const Δλ = toRad(lon2 - lon1);

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  };

  const shouldTriggerHighAccuracy = (newLocation: any) => {
    if (!lastLocation) {
      lastLocation = newLocation;
      return false;
    }

    const distance = calculateDistance(
      lastLocation.coords.latitude,
      lastLocation.coords.longitude,
      newLocation.coords.latitude,
      newLocation.coords.longitude,
    );

    if (distance > 100) {
      // Customize this threshold
      lastLocation = newLocation;
      return true;
    }

    return false;
  };

  const getHighAccuracyLocation = () => {
    Geolocation.getCurrentPosition(
      position => {
        console.log('High-accuracy location:', position);
        setLocation(position);
      },
      error => {
        console.error('Error fetching high-accuracy location:', error);
      },
      {
        enableHighAccuracy: true, // Use GPS for precise updates
        timeout: 10000,
      },
    );
  };

  useEffect(() => {
    const subscription = accelerometer.subscribe(
      ({x, y, z}) => {
        // Calculate the magnitude of acceleration
        const magnitude = Math.sqrt(x * x + y * y + z * z);
        console.log(magnitude);

        // Check if the magnitude indicates motion (adjust the threshold as needed)
        if (magnitude > 1.2) {
          if (!isMoving) {
            console.log('Device started moving');
            isMoving = true;

            Geolocation.watchPosition(
              position => {
                console.log('Low-power location update:', position);
                setLocation(position);
                if (shouldTriggerHighAccuracy(position)) {
                  console.log(
                    'Device has moved significantly. Triggering high-accuracy GPS...',
                  );
                  getHighAccuracyLocation();
                }
              },
              error => {
                console.error('Error with low-power updates:', error);
              },
              {
                enableHighAccuracy: false, // Conserve battery with low-power mode
                distanceFilter: 500, // Broad movement detection (e.g., 500 meters)
              },
            );
          }
        } else {
          if (isMoving) {
            console.log('Device stopped moving');
            isMoving = false;
          }
        }
      },
      error => {
        console.error('Error with accelerometer:', error);
      },
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (!location) {
    return null;
  }

  let date = new Date(location?.timestamp * 1000);
  var hours = date.getHours();
  var minutes = date.getMinutes();
  var seconds = date.getSeconds();

  return (
    <SafeAreaView
      style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
      <View style={{flexDirection: 'row', gap: 8}}>
        <Text>Time</Text>
        <Text>
          {hours} {minutes} : {seconds}
        </Text>
      </View>
      <View style={{flexDirection: 'row', gap: 8}}>
        <Text>latitude</Text>
        <Text>{location?.coords?.latitude}</Text>
      </View>
      <View style={{flexDirection: 'row', gap: 8}}>
        <Text>longitude</Text>
        <Text>{location?.coords?.longitude}</Text>
      </View>
    </SafeAreaView>
  );
};

export default App;
