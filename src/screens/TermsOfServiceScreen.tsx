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

export default function TermsOfServiceScreen() {
  const { colors } = useApp();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.backHeader, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <MaterialIcons name="arrow-back" size={24} color={colors.primaryText} />
        </TouchableOpacity>
        <Text style={[styles.backHeaderTitle, { color: colors.primaryText }]}>Terms of Service</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.effectiveDate, { color: colors.hint }]}>Effective {EFFECTIVE_DATE}</Text>
        <Text style={[styles.intro, { color: colors.secondaryText }]}>
          Please read these Terms of Service (&quot;Terms&quot;) carefully before using the Canada247 website or
          mobile application (together, the &quot;Service&quot;), operated by Canada247 (&quot;we&quot;,
          &quot;us&quot;, &quot;our&quot;).
        </Text>

        <LegalSection title="1. Acceptance of Terms">
          <LegalParagraph>
            By creating an account or using the Service, you agree to be bound by these Terms. If you don&apos;t
            agree, please don&apos;t use the Service.
          </LegalParagraph>
        </LegalSection>

        <LegalSection title="2. The Service">
          <LegalParagraph>
            Canada247 aggregates and publishes news content across Canadian regions and categories, and lets
            registered users save articles, react to and comment on stories, and submit their own community news
            posts.
          </LegalParagraph>
        </LegalSection>

        <LegalSection title="3. Accounts">
          <LegalParagraph>
            You must provide a valid email address to create an account. We use a one-time code sent to that
            address to verify sign-in — you&apos;re responsible for keeping access to that email secure. You must
            be at least 13 years old to create an account.
          </LegalParagraph>
        </LegalSection>

        <LegalSection title="4. User-Generated Content">
          <LegalParagraph>
            When you submit a community post, comment, or other content, you retain ownership of it, but you grant
            Canada247 a non-exclusive, worldwide, royalty-free license to host, display, and distribute it as part
            of the Service. Community posts are reviewed before they&apos;re published and may be approved,
            rejected, or removed at our discretion — including after publication, if they&apos;re later found to
            violate these Terms.
          </LegalParagraph>
          <LegalParagraph>
            You agree not to submit content that is illegal, defamatory, harassing, hateful, sexually explicit,
            infringes someone else&apos;s intellectual property or privacy rights, or is deliberately false or
            misleading.
          </LegalParagraph>
        </LegalSection>

        <LegalSection title="5. Acceptable Use">
          <LegalParagraph>You agree not to:</LegalParagraph>
          <LegalBullet>use the Service for any unlawful purpose;</LegalBullet>
          <LegalBullet>attempt to gain unauthorized access to any part of the Service;</LegalBullet>
          <LegalBullet>interfere with or disrupt the Service&apos;s operation;</LegalBullet>
          <LegalBullet>scrape or harvest data from the Service beyond normal personal use; or</LegalBullet>
          <LegalBullet>impersonate another person or entity.</LegalBullet>
        </LegalSection>

        <LegalSection title="6. Third-Party News Content">
          <LegalParagraph>
            Much of the news shown in the Service is aggregated from third-party publishers and sources. Canada247
            does not independently verify the accuracy of third-party content and is not responsible for it.
            Rights to that content remain with its original publishers.
          </LegalParagraph>
        </LegalSection>

        <LegalSection title="7. Intellectual Property">
          <LegalParagraph>
            The Canada247 name, logo, and app/website design are owned by Canada247. Except for content you submit
            or third-party news content, you may not copy, modify, or redistribute any part of the Service without
            our permission.
          </LegalParagraph>
        </LegalSection>

        <LegalSection title="8. Disclaimers">
          <LegalParagraph>
            The Service is provided &quot;as is&quot; and &quot;as available,&quot; without warranties of any
            kind, express or implied, including that it will be accurate, uninterrupted, or error-free.
          </LegalParagraph>
        </LegalSection>

        <LegalSection title="9. Limitation of Liability">
          <LegalParagraph>
            To the fullest extent permitted by law, Canada247 is not liable for any indirect, incidental, or
            consequential damages arising from your use of the Service.
          </LegalParagraph>
        </LegalSection>

        <LegalSection title="10. Termination">
          <LegalParagraph>
            We may suspend or terminate your account if you violate these Terms. You may stop using the Service,
            or request account deletion, at any time by contacting us.
          </LegalParagraph>
        </LegalSection>

        <LegalSection title="11. Changes to These Terms">
          <LegalParagraph>
            We may update these Terms from time to time. Continuing to use the Service after changes take effect
            means you accept the updated Terms.
          </LegalParagraph>
        </LegalSection>

        <LegalSection title="12. Governing Law">
          <LegalParagraph>
            These Terms are governed by the laws of the Province of Ontario and the federal laws of Canada
            applicable therein.
          </LegalParagraph>
        </LegalSection>

        <LegalSection title="13. Contact Us">
          <LegalParagraph>Questions about these Terms? Email us at {CONTACT_EMAIL}.</LegalParagraph>
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
