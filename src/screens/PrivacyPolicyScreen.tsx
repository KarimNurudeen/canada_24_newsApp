import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useApp } from '../context/AppContext';
import { LegalSection, LegalParagraph, LegalBullet } from '../components/LegalContent';
import type { RootStackParamList } from '../navigation/types';

const EFFECTIVE_DATE = 'July 26, 2026';
const CONTACT_EMAIL = 'info@canada247.com';

export default function PrivacyPolicyScreen() {
  const { colors } = useApp();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.backHeader, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <MaterialIcons name="arrow-back" size={24} color={colors.primaryText} />
        </TouchableOpacity>
        <Text style={[styles.backHeaderTitle, { color: colors.primaryText }]}>Privacy Policy</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.effectiveDate, { color: colors.hint }]}>Effective {EFFECTIVE_DATE}</Text>
        <Text style={[styles.intro, { color: colors.secondaryText }]}>
          Canada247 (&quot;Canada247&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) operates the Canada247
          website (canada247.news) and the Canada247 mobile application (together, the &quot;Service&quot;). This
          Privacy Policy explains what information we collect, how we use it, and the choices you have.
        </Text>

        <LegalSection title="1. Information We Collect">
          <LegalParagraph>
            Account information. When you sign in, we collect your email address and use a one-time verification
            code (OTP) to confirm it — we never store a password. You may optionally add a display name, a short
            bio, and a profile photo.
          </LegalParagraph>
          <LegalParagraph>
            Content you submit. Community news posts you create (headline, body text, category, and any image),
            comments, likes/dislikes, reposts, and saved articles.
          </LegalParagraph>
          <LegalParagraph>
            Preferences. The Canadian region(s) you follow, and which news alert categories you&apos;ve enabled.
          </LegalParagraph>
          <LegalParagraph>
            Notification data. If you enable push notifications, we store a device push token and platform
            (iOS/Android) so we can deliver alerts to your device.
          </LegalParagraph>
          <LegalParagraph>
            Automatically collected data. Like most online services, our servers log standard technical
            information such as IP address and device/browser type for security and troubleshooting.
          </LegalParagraph>
        </LegalSection>

        <LegalSection title="2. How We Use Your Information">
          <LegalParagraph>
            We use the information above to: authenticate your account; show you news relevant to the regions and
            categories you follow; let you save, react to, comment on, and post content; deliver the notifications
            you&apos;ve opted into; moderate community-submitted posts before they&apos;re published; and maintain
            and improve the Service.
          </LegalParagraph>
        </LegalSection>

        <LegalSection title="3. How We Share Information">
          <LegalParagraph>We do not sell your personal information. We share data only with:</LegalParagraph>
          <LegalBullet>
            Service providers that help us operate the Service (e.g., Expo&apos;s push notification service, which
            relays notification content to your device using the push token you registered; our
            hosting/infrastructure providers).
          </LegalBullet>
          <LegalBullet>Legal authorities, if required to comply with a law, regulation, or valid legal process.</LegalBullet>
        </LegalSection>

        <LegalSection title="4. Data Retention">
          <LegalParagraph>
            We keep your account information for as long as your account is active. If you ask us to delete your
            account, we delete or anonymize your personal data within a reasonable time, except where we&apos;re
            required to retain it for legal reasons.
          </LegalParagraph>
        </LegalSection>

        <LegalSection title="5. Your Rights & Choices">
          <LegalParagraph>
            You can review or update your display name, bio, and avatar from your profile. You can turn individual
            notification categories on or off, or disable notifications entirely, at any time. To request access
            to, correction of, or deletion of your personal data, email us at {CONTACT_EMAIL}.
          </LegalParagraph>
        </LegalSection>

        <LegalSection title="6. Children's Privacy">
          <LegalParagraph>
            The Service is not directed to children under 13, and we do not knowingly collect personal information
            from children under 13. If you believe a child has provided us with personal information, contact us
            and we will remove it.
          </LegalParagraph>
        </LegalSection>

        <LegalSection title="7. Security">
          <LegalParagraph>
            We use reasonable technical and organizational measures to protect your information. No method of
            transmission or storage is 100% secure, so we can&apos;t guarantee absolute security.
          </LegalParagraph>
        </LegalSection>

        <LegalSection title="8. Cookies & Local Storage">
          <LegalParagraph>
            Our website uses browser local storage to remember your preferences (such as dark mode and saved
            region selections) and to keep you signed in. We do not currently use third-party advertising or
            tracking cookies.
          </LegalParagraph>
        </LegalSection>

        <LegalSection title="9. Changes to This Policy">
          <LegalParagraph>
            We may update this Privacy Policy from time to time. If we make material changes, we&apos;ll update
            the effective date above.
          </LegalParagraph>
        </LegalSection>

        <LegalSection title="10. Contact Us">
          <LegalParagraph>Questions about this policy? Email us at {CONTACT_EMAIL}.</LegalParagraph>
        </LegalSection>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  backHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  backHeaderTitle: { fontSize: 17, fontWeight: '700' },
  content: { paddingHorizontal: 20, paddingBottom: 48 },
  effectiveDate: { fontSize: 12, fontWeight: '600', marginBottom: 12 },
  intro: { fontSize: 14, lineHeight: 21, marginBottom: 24 },
});
