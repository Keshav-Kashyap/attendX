import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Text } from '../../ui/text';
import { User, FileSpreadsheet } from 'lucide-react-native';

export default function QuickActionsGrid({ onNavigateTab }) {
  return (
    <View style={{ marginBottom: 24 }}>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        {/* Button 1: Student Lookup */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => onNavigateTab && onNavigateTab('students')}
          style={{
            flex: 1,
            backgroundColor: '#ffffff',
            borderRadius: 20,
            borderWidth: 1,
            borderColor: '#e2e8f0',
            padding: 14,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            shadowColor: '#0f172a',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.03,
            shadowRadius: 4,
            elevation: 1,
          }}
        >
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 14,
              backgroundColor: '#eff6ff',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <User size={20} color="#0052cc" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: '800', color: '#0f172a' }}>
              Student Lookup
            </Text>
            <Text numberOfLines={1} style={{ fontSize: 11, fontWeight: '500', color: '#64748b', marginTop: 1 }}>
              ID & Face Roster
            </Text>
          </View>
        </TouchableOpacity>

        {/* Button 2: Export Reports */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => onNavigateTab && onNavigateTab('reports')}
          style={{
            flex: 1,
            backgroundColor: '#ffffff',
            borderRadius: 20,
            borderWidth: 1,
            borderColor: '#e2e8f0',
            padding: 14,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            shadowColor: '#0f172a',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.03,
            shadowRadius: 4,
            elevation: 1,
          }}
        >
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 14,
              backgroundColor: '#f5f3ff',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <FileSpreadsheet size={20} color="#8b5cf6" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: '800', color: '#0f172a' }}>
              Export Reports
            </Text>
            <Text numberOfLines={1} style={{ fontSize: 11, fontWeight: '500', color: '#64748b', marginTop: 1 }}>
              CSV & SIS For...
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}
