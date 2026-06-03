import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { getPeriodLabel, getPrevPeriod, getNextPeriod } from '../utils/period';
import { Feather } from '@expo/vector-icons';

interface Props {
  period: string;
  minPeriod: string;
  onPeriodChange: (p: string) => void;
  subtitle?: string;
}

export default function PeriodSelector({ period, minPeriod, onPeriodChange, subtitle }: Props) {
  const isAtMin = period <= minPeriod;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.arrow, isAtMin && styles.arrowDisabled]}
        onPress={() => onPeriodChange(getPrevPeriod(period))}
        disabled={isAtMin}
        activeOpacity={0.7}
      >
        <Feather 
          name="chevron-left" 
          size={24} 
          color={isAtMin ? '#D0C5C0' : '#C63D5F'} 
        />
      </TouchableOpacity>

      <View style={styles.labelWrap}>
        <Text style={styles.label}>{getPeriodLabel(period)}</Text>
        {subtitle ? <Text style={styles.sub}>{subtitle}</Text> : null}
      </View>

      <TouchableOpacity 
        style={styles.arrow} 
        onPress={() => onPeriodChange(getNextPeriod(period))}
        activeOpacity={0.7}
      >
        <Feather name="chevron-right" size={24} color="#C63D5F" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row', 
    alignItems: 'center',
    backgroundColor: '#fff', 
    borderRadius: 16,
    marginBottom: 20, 
    overflow: 'hidden',
    shadowColor: '#3C2415', 
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05, 
    shadowRadius: 12, 
    elevation: 3,
    borderWidth: 1, 
    borderColor: '#EFE9E2',
  },
  arrow: {
    width: 56, 
    height: 64, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: '#FAF7F2',
  },
  arrowDisabled: { 
    backgroundColor: '#FDFCFB' 
  },
  labelWrap: { 
    flex: 1, 
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { 
    fontSize: 16, 
    fontWeight: '800', 
    color: '#3C2415',
    letterSpacing: 0.3,
  },
  sub: { 
    fontSize: 12, 
    color: '#8C6246', 
    fontWeight: '600',
    marginTop: 3, 
  },
});
