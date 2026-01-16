import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, ActivityIndicator } from 'react-native';
import Colors from '@/constants/colors';
import Typography from '@/constants/typography';
import Spacing from '@/constants/spacing';
import { useLocation } from '@/contexts/LocationContext';
import { useAlert } from '@/contexts/AlertContext';

export default function LocationSelector() {
  const { location, getCurrentLocation, setManualLocation, isLoading } = useLocation();
  const { showSuccess, showError } = useAlert();
  const [modalVisible, setModalVisible] = useState(false);
  const [manualCity, setManualCity] = useState('');
  const [manualRegion, setManualRegion] = useState('');

  const handleDetectLocation = async () => {
    const result = await getCurrentLocation();
    if (result) {
      setModalVisible(false);
      showSuccess('Location Detected', `We found you in ${result.city}, ${result.region}!`);
    } else {
      showError('Location Error', 'Unable to detect your location. Please enter it manually.');
    }
  };

  const handleManualSubmit = async () => {
    if (!manualCity.trim() || !manualRegion.trim()) {
      showError('Missing Information', 'Please enter both city and region.');
      return;
    }

    const city = manualCity.trim();
    const region = manualRegion.trim();

    // Try to geocode the city/region to get coordinates
    let coords: { latitude: number; longitude: number } | undefined;
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city + ', ' + region)}&format=json&limit=1`,
        {
          headers: {
            'Accept': 'application/json',
          },
          mode: 'cors',
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          coords = {
            latitude: parseFloat(data[0].lat),
            longitude: parseFloat(data[0].lon),
          };
        }
      }
    } catch (error) {
      console.log('Geocoding failed for manual location, continuing without coordinates:', error);
    }

    setManualLocation({
      city,
      region,
      country: 'USA',
      ...(coords && { coords }),
    });

    setModalVisible(false);
    setManualCity('');
    setManualRegion('');
    showSuccess('Location Set', `Location set to ${city}, ${region}`);
  };

  return (
    <>
      <TouchableOpacity 
        style={styles.locationButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={[styles.locationText, location && styles.locationTextActive]}>
          {location ? `${location.city}, ${location.region}` : 'Set Location'}
        </Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Your Location</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.optionalBadge}>
              <Text style={styles.optionalBadgeText}>Optional</Text>
            </View>

            <Text style={styles.modalDescription}>
              Get personalized activities based on your location, local weather, and nearby attractions.
            </Text>

            <Text style={styles.modalNote}>
              Note: You can still generate great activities without setting a location — they just won&apos;t be as locally tailored.
            </Text>

            <TouchableOpacity
              style={styles.detectButton}
              onPress={handleDetectLocation}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={Colors.background} />
              ) : (
                <Text style={styles.detectButtonText}>Detect My Location</Text>
              )}
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or enter manually</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>City</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., San Francisco"
                placeholderTextColor="#666666"
                value={manualCity}
                onChangeText={setManualCity}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>State/Region</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., California"
                placeholderTextColor="#666666"
                value={manualRegion}
                onChangeText={setManualRegion}
              />
            </View>

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleManualSubmit}
            >
              <Text style={styles.submitButtonText}>Set Location</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.skipButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.skipButtonText}>Skip for Now</Text>
            </TouchableOpacity>

            {location && (
              <Text style={styles.currentLocationText}>
                Current: {location.city}, {location.region}
              </Text>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: 20,
    backgroundColor: Colors.cardBackground,
  },
  locationText: {
    fontSize: Typography.sizes.caption,
    color: Colors.textLight,
    fontWeight: '400' as const,
  },
  locationTextActive: {
    color: Colors.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1A1A1A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: Spacing.xl,
    paddingBottom: Spacing.xxl,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  modalTitle: {
    fontSize: Typography.sizes.h2,
    fontWeight: '400' as const,
    color: '#FFFFFF',
  },
  closeButton: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: '400' as const,
  },
  modalDescription: {
    fontSize: Typography.sizes.body,
    color: '#B8B8B8',
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  detectButton: {
    backgroundColor: '#FF6B9D',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: 12,
    marginBottom: Spacing.lg,
  },
  detectButtonText: {
    fontSize: Typography.sizes.body,
    fontWeight: '400' as const,
    color: '#1A1A1A',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#333333',
  },
  dividerText: {
    fontSize: Typography.sizes.caption,
    color: '#B8B8B8',
    marginHorizontal: Spacing.md,
  },
  inputContainer: {
    marginBottom: Spacing.md,
  },
  inputLabel: {
    fontSize: Typography.sizes.caption,
    fontWeight: '400' as const,
    color: '#FFFFFF',
    marginBottom: Spacing.xs,
  },
  input: {
    backgroundColor: '#252525',
    borderRadius: 12,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    fontSize: Typography.sizes.body,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#333333',
  },
  submitButton: {
    backgroundColor: '#FF6B9D',
    paddingVertical: Spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  submitButtonText: {
    fontSize: Typography.sizes.body,
    fontWeight: '400' as const,
    color: '#1A1A1A',
  },
  currentLocationText: {
    fontSize: Typography.sizes.caption,
    color: '#B8B8B8',
    textAlign: 'center',
    marginTop: Spacing.lg,
  },
  optionalBadge: {
    alignSelf: 'center',
    backgroundColor: '#FFD700',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 20,
    marginBottom: Spacing.md,
  },
  optionalBadgeText: {
    fontSize: Typography.sizes.caption,
    fontWeight: '400' as const,
    color: '#1A1A1A',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalNote: {
    fontSize: Typography.sizes.small,
    color: '#B8B8B8',
    backgroundColor: '#252525',
    padding: Spacing.md,
    borderRadius: 12,
    marginBottom: Spacing.lg,
    lineHeight: 20,
  },
  skipButton: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  skipButtonText: {
    fontSize: Typography.sizes.body,
    fontWeight: '400' as const,
    color: '#B8B8B8',
  },
});
