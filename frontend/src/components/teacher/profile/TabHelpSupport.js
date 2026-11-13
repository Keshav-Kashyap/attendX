import React, { useState } from 'react';
import { View, TouchableOpacity, Linking } from 'react-native';
import { Text } from '../../ui/text';
import { GraduationCap } from 'lucide-react-native';

export default function TabHelpSupport() {
  const [expandedFaq, setExpandedFaq] = useState(null);

  const faqs = [
    {
      q: 'How does AI face recognition work in the classroom?',
      a: 'Faculty captures 1 or more classroom photos from the front and sides. The AI detects faces, compares them against enrolled student embeddings, and automatically marks present students with confidence levels above 90%.',
    },
    {
      q: 'Can I manually override or correct attendance status?',
      a: 'Yes. In the Attendance tab or History, tap any student row to change their status between Present, Absent, Late, or Pending, and add optional remarks.',
    },
    {
      q: 'How do I export attendance records for official submissions?',
      a: 'Visit the Reports tab. Tap the "Export Report" action to generate CSV data or a PDF-formatted summary with attendance percentages and absent student lists.',
    },
    {
      q: 'What if a student’s face is not being detected?',
      a: 'Ensure the classroom has adequate lighting and students look towards the camera. If a student recently enrolled or altered appearance, they can update their biometric profile from their student portal.',
    },
  ];

  const toggleFaq = (idx) => {
    setExpandedFaq(expandedFaq === idx ? null : idx);
  };

  return (
    <View className="gap-4">
      {/* Quick Contact Card */}
      <View className="p-4 bg-primary/10 border border-primary/25 rounded-2xl">
        <View className="flex-row items-center gap-2 mb-1.5">
          <GraduationCap size={20} color="#0284c7" />
          <Text className="text-sm font-bold text-foreground">
            Campus IT & Support Desk
          </Text>
        </View>
        <Text className="text-xs text-muted-foreground leading-relaxed">
          Need assistance with camera hardware, course assignments, or system setup? Reach out to your institution’s system administrators.
        </Text>

        <View className="flex-row gap-2 mt-3">
          <View className="flex-1 bg-card/80 p-2.5 rounded-xl border border-border">
            <Text className="text-[10px] text-muted-foreground">Support Email</Text>
            <Text className="text-xs font-bold text-foreground mt-0.5">
              support@university.edu
            </Text>
          </View>
          <View className="flex-1 bg-card/80 p-2.5 rounded-xl border border-border">
            <Text className="text-[10px] text-muted-foreground">Helpline Ext</Text>
            <Text className="text-xs font-bold text-foreground mt-0.5">
              Ext: 4402 (Admin Block)
            </Text>
          </View>
        </View>
      </View>

      {/* Frequently Asked Questions */}
      <View>
        <Text className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">
          Frequently Asked Questions
        </Text>

        <View className="gap-2">
          {faqs.map((faq, idx) => {
            const isOpen = expandedFaq === idx;
            return (
              <TouchableOpacity
                key={idx}
                activeOpacity={0.8}
                onPress={() => toggleFaq(idx)}
                className="p-3 bg-card border border-border/80 rounded-xl"
              >
                <View className="flex-row justify-between items-center">
                  <Text className="flex-1 text-xs font-bold text-foreground pr-2">
                    {faq.q}
                  </Text>
                  <Text className="text-xs font-bold text-primary">
                    {isOpen ? '▲' : '▼'}
                  </Text>
                </View>

                {isOpen ? (
                  <Text className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border/60 leading-relaxed">
                    {faq.a}
                  </Text>
                ) : null}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Version & Build */}
      <View className="items-center py-2">
        <Badge variant="outline" className="px-3 py-1 bg-muted/40">
          <Text className="text-[10px] text-muted-foreground font-semibold">
            AI Attendance v2.4.0 • Faculty Build 2026
          </Text>
        </Badge>
      </View>
    </View>
  );
}
