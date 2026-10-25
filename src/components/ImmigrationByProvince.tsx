import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useWindowDimensions, Platform } from 'react-native';
import Svg, { Path, G, Line, Circle, Text as SvgText, TSpan } from 'react-native-svg';
import { useApp } from '../context/AppContext';
import { fetchImmigrationStats, type ImmigrationStats } from '../services/newsService';
import { CANADA_PROVINCES, CANADA_VIEWBOX } from '../lib/canadaMap';

/** Choropleth of permanent-resident admissions by province — same data, bins
 * and colour ramps as the web widget, drawn with react-native-svg. */
const LABEL_FONT = Platform.OS === 'web' ? 'system-ui, -apple-system, sans-serif' : undefined;

const BINS = [
  { min: 0, label: 'Under 1%' },
  { min: 1, label: '1–5%' },
  { min: 5, label: '5–10%' },
  { min: 10, label: '10–20%' },
  { min: 20, label: '20%+' },
];

const RAMP = {
  light: {
    fills: ['#F7E4E1', '#F0B8AE', '#E2786A', '#D52B1E', '#8C1A11'],
    text: ['#5C1B15', '#5C1B15', '#FFFFFF', '#FFFFFF', '#FFFFFF'],
    none: '#E9ECEF', stroke: '#FFFFFF', halo: '#1a1a1a', callout: '#1a1a1a', calloutSub: '#555555',
  },
  dark: {
    fills: ['#2E2528', '#5C2A29', '#963229', '#D52B1E', '#FF6B58'],
    text: ['#E4D6D6', '#FFFFFF', '#FFFFFF', '#FFFFFF', '#2A0B07'],
    none: '#1F2630', stroke: '#0B0F14', halo: '#F5F5F5', callout: '#FFFFFF', calloutSub: '#C5CBD3',
  },
};

/** NB sits too close to NS/PE/NL for in-shape text, so it gets a callout in open water, like PE and NS. */
const CALLOUT_OVERRIDES: Record<string, { x: number; y: number; ax: number; ay: number }> = {
  NB: { x: 782, y: 806, ax: 826, ay: 716 },
};

function binFor(share?: number): number | null {
  if (share === undefined) return null;
  let idx = 0;
  BINS.forEach((b, i) => { if (share >= b.min) idx = i; });
  return idx;
}

const fmtShare = (n: number) => (n > 0 && n < 0.1 ? '<0.1' : n.toFixed(1));
const full = (n: number) => n.toLocaleString('en-CA');

export default function ImmigrationByProvince() {
  const { colors, darkMode } = useApp();
  const { width } = useWindowDimensions();
  const [stats, setStats] = useState<ImmigrationStats | null>(null);
  const [pinned, setPinned] = useState<string | null>(null);
  const ramp = darkMode ? RAMP.dark : RAMP.light;

  useEffect(() => {
    let cancelled = false;
    fetchImmigrationStats().then(s => { if (!cancelled) setStats(s); });
    return () => { cancelled = true; };
  }, []);

  const model = useMemo(() => {
    if (!stats) return null;
    const national = stats.national_total ?? stats.provinces.reduce((sum, p) => sum + p.total, 0);
    const provinces = stats.provinces.map(p =>
      p.share === 0 && p.total > 0 && national > 0 ? { ...p, share: (p.total / national) * 100 } : p,
    );
    const ranked = [...provinces].sort((a, b) => b.total - a.total);
    return {
      byName: new Map(provinces.map(p => [p.province, p])),
      ranked,
      rankOf: new Map(ranked.map((p, i) => [p.province, i + 1])),
      max: ranked[0]?.total ?? 0,
      national,
    };
  }, [stats]);

  if (!stats || !model || stats.provinces.length === 0) return null;

  const { byName, ranked, rankOf, max, national } = model;
  const nameToCode = new Map(CANADA_PROVINCES.map(p => [p.name, p.code]));
  const activeShape = pinned ? CANADA_PROVINCES.find(p => p.code === pinned) : undefined;
  const activeStat = activeShape ? byName.get(activeShape.name) : undefined;
  const drawOrder = [...CANADA_PROVINCES].sort((a, b) => Number(a.code === pinned) - Number(b.code === pinned));
  const [, , vbW, vbH] = CANADA_VIEWBOX.split(' ').map(Number);
  const mapW = width - 40 - 24;
  const mapH = (mapW * vbH) / vbW;
  const toggle = (code: string) => setPinned(p => (p === code ? null : code));

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.divider }]}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.primaryText }]}>Immigration by Province</Text>
          <Text style={[styles.sub, { color: colors.hint }]}>Permanent resident admissions by destination</Text>
        </View>
        <View style={[styles.year, { borderColor: colors.primary + '66' }]}>
          <Text style={[styles.yearText, { color: colors.primary }]}>{stats.year}</Text>
        </View>
      </View>

      {/* Detail strip (fixed height so tapping never shifts the page) */}
      <View style={[styles.detail, { backgroundColor: colors.background, borderColor: colors.divider }]}>
        {activeShape && activeStat ? (
          <>
            <View style={{ flex: 1 }}>
              <Text style={[styles.eyebrow, { color: colors.hint }]}>#{rankOf.get(activeShape.name)} OF {ranked.length}</Text>
              <Text style={[styles.detailName, { color: colors.primaryText }]} numberOfLines={1}>{activeShape.name}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[styles.detailShare, { color: colors.primary }]}>{fmtShare(activeStat.share)}%</Text>
              <Text style={[styles.detailSmall, { color: colors.hint }]}>{full(activeStat.total)} admissions</Text>
            </View>
          </>
        ) : activeShape ? (
          <>
            <Text style={[styles.detailName, { color: colors.primaryText, flex: 1 }]}>{activeShape.name}</Text>
            <Text style={[styles.detailSmall, { color: colors.hint }]}>No data reported</Text>
          </>
        ) : (
          <>
            <View>
              <Text style={[styles.eyebrow, { color: colors.hint }]}>CANADA TOTAL</Text>
              <Text style={[styles.detailTotal, { color: colors.primaryText }]}>{full(national)}</Text>
            </View>
            <Text style={[styles.detailSmall, { color: colors.hint, flex: 1, textAlign: 'right' }]}>Tap a province for its share of admissions.</Text>
          </>
        )}
      </View>

      <View style={{ paddingHorizontal: 12 }}>
        <Svg width={mapW} height={mapH} viewBox={CANADA_VIEWBOX}>
          {drawOrder.map(prov => {
            const stat = byName.get(prov.name);
            const bin = binFor(stat?.share);
            const isActive = prov.code === pinned;
            return (
              <Path
                key={prov.code}
                d={prov.d}
                fill={bin === null ? ramp.none : ramp.fills[bin]}
                stroke={isActive ? ramp.halo : ramp.stroke}
                strokeWidth={isActive ? 3 : 1.4}
                strokeLinejoin="round"
                opacity={pinned && !isActive ? 0.55 : 1}
                onPress={() => toggle(prov.code)}
              />
            );
          })}
          {/* Labels are drawn after all shapes so no neighbour paints over them */}
          {CANADA_PROVINCES.map(prov => {
            const stat = byName.get(prov.name);
            if (!stat) return null;
            const bin = binFor(stat.share) ?? 0;
            const callout =
              CALLOUT_OVERRIDES[prov.code] ??
              (prov.outside && prov.anchorX !== undefined && prov.anchorY !== undefined
                ? { x: prov.cx, y: prov.cy, ax: prov.anchorX, ay: prov.anchorY }
                : null);

            if (callout) {
              return (
                <G key={`${prov.code}-label`} pointerEvents="none">
                  <Line x1={callout.ax} y1={callout.ay} x2={callout.x - 46} y2={callout.y - 7} stroke="#9AA3AF" strokeWidth={1.4} />
                  <Circle cx={callout.ax} cy={callout.ay} r={3.5} fill="#9AA3AF" />
                  <SvgText fontFamily={LABEL_FONT} x={callout.x - 40} y={callout.y} fontSize={21} fontWeight="800" fill={ramp.callout} textAnchor="start">
                    {prov.code}{' '}
                    <TSpan fontWeight="600" fill={ramp.calloutSub}>{fmtShare(stat.share)}%</TSpan>
                  </SvgText>
                </G>
              );
            }

            const small = stat.share < 1;
            return (
              <G key={`${prov.code}-label`} pointerEvents="none">
                <SvgText fontFamily={LABEL_FONT} x={prov.cx} y={prov.cy} fontSize={small ? 22 : 26} fontWeight="800" fill={ramp.text[bin]} textAnchor="middle">
                  {prov.code}
                </SvgText>
                <SvgText
                  x={prov.cx}
                  y={prov.cy + (small ? 21 : 25)}
                  fontSize={small ? 19 : 22}
                  fontWeight="600"
                  fill={ramp.text[bin]}
                  opacity={0.92}
                  textAnchor="middle"
                >
                  {fmtShare(stat.share)}%
                </SvgText>
              </G>
            );
          })}
        </Svg>
      </View>

      <View style={styles.legend}>
        <Text style={[styles.eyebrow, { color: colors.hint }]}>SHARE OF NATIONAL ADMISSIONS</Text>
        <View style={styles.legendRow}>
          {BINS.map((b, i) => (
            <View key={b.label} style={styles.legendItem}>
              <View style={[styles.swatch, { backgroundColor: ramp.fills[i], borderColor: colors.divider }]} />
              <Text style={[styles.legendText, { color: colors.secondaryText }]}>{b.label}</Text>
            </View>
          ))}
          <View style={styles.legendItem}>
            <View style={[styles.swatch, { backgroundColor: ramp.none, borderColor: colors.divider }]} />
            <Text style={[styles.legendText, { color: colors.secondaryText }]}>No data</Text>
          </View>
        </View>
      </View>

      <View style={[styles.rank, { borderTopColor: colors.divider }]}>
        <Text style={[styles.eyebrow, { color: colors.hint, marginBottom: 8 }]}>RANKED BY ADMISSIONS</Text>
        {ranked.map((p, i) => {
          const code = nameToCode.get(p.province);
          const bin = binFor(p.share) ?? 0;
          const isActive = !!code && code === pinned;
          return (
            <TouchableOpacity
              key={p.province}
              onPress={() => code && toggle(code)}
              activeOpacity={0.8}
              style={[styles.rankRow, isActive && { backgroundColor: colors.background }]}
            >
              <Text style={[styles.rankNo, { color: colors.hint }]}>{i + 1}</Text>
              <Text style={[styles.rankName, { color: colors.primaryText }]} numberOfLines={1}>{p.province}</Text>
              <View style={[styles.barTrack, { backgroundColor: colors.divider }]}>
                <View style={{ width: `${Math.max(2, (p.total / max) * 100)}%`, height: '100%', borderRadius: 4, backgroundColor: ramp.fills[Math.max(bin, 2)] }} />
              </View>
              <Text style={[styles.rankShare, { color: colors.primaryText }]}>{fmtShare(p.share)}%</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {stats.top_source_countries.length > 0 ? (
        <View style={[styles.sources, { borderTopColor: colors.divider, backgroundColor: colors.background }]}>
          <Text style={[styles.eyebrow, { color: colors.hint, marginBottom: 8 }]}>TOP SOURCE COUNTRIES</Text>
          <View style={styles.chips}>
            {stats.top_source_countries.map((c, i) => (
              <View key={c.country} style={[styles.chip, { backgroundColor: colors.surface, borderColor: colors.divider }]}>
                <Text style={[styles.chipText, { color: colors.primaryText }]}>
                  <Text style={{ color: colors.primary }}>{i + 1} </Text>
                  {c.country.split(',')[0]}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {stats.source ? (
        <Text style={[styles.note, { color: colors.hint }]}>{stats.source}. {stats.note}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: 20, marginTop: 26, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 16, paddingBottom: 12 },
  title: { fontSize: 16, fontWeight: '800' },
  sub: { fontSize: 12, fontWeight: '500', marginTop: 2 },
  year: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  yearText: { fontSize: 12, fontWeight: '800', letterSpacing: 0.6 },
  detail: { flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: 16, marginBottom: 8, minHeight: 64, paddingHorizontal: 14, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth },
  eyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 1.1 },
  detailName: { fontSize: 15, fontWeight: '800' },
  detailShare: { fontSize: 19, fontWeight: '900' },
  detailSmall: { fontSize: 11, fontWeight: '500', marginTop: 2 },
  detailTotal: { fontSize: 19, fontWeight: '900' },
  legend: { paddingHorizontal: 16, paddingTop: 6, paddingBottom: 14 },
  legendRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  swatch: { width: 16, height: 12, borderRadius: 3, borderWidth: StyleSheet.hairlineWidth },
  legendText: { fontSize: 11, fontWeight: '500' },
  rank: { padding: 16, borderTopWidth: StyleSheet.hairlineWidth },
  rankRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6, paddingHorizontal: 4, borderRadius: 8 },
  rankNo: { width: 16, fontSize: 11, textAlign: 'right', fontWeight: '600' },
  rankName: { width: 112, fontSize: 12.5, fontWeight: '700' },
  barTrack: { flex: 1, height: 8, borderRadius: 4, overflow: 'hidden' },
  rankShare: { width: 44, textAlign: 'right', fontSize: 12, fontWeight: '800' },
  sources: { padding: 16, borderTopWidth: StyleSheet.hairlineWidth },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  chipText: { fontSize: 11.5, fontWeight: '700' },
  note: { fontSize: 10, lineHeight: 14, padding: 16, paddingTop: 10 },
});
