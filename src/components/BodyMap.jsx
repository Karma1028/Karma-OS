import React from 'react';

// Anatomical region polygons adapted from the archived gym_dashboard.py body-map
// (archive/dashboards/gym-hevy-standalone/gym_dashboard.py), remapped onto
// Hevy's own primary_muscle_group taxonomy so it's driven by live data.
const FRONT_REGIONS = {
  'chest_upper': { pts: '115,155 145,145 180,145 180,165 145,170 115,165', muscle: 'Chest', label: 'Chest (upper)' },
  'chest': { pts: '112,168 145,172 180,172 180,205 112,205', muscle: 'Chest', label: 'Chest' },
  'chest_lower': { pts: '115,203 145,207 180,207 180,225 115,225', muscle: 'Chest', label: 'Chest (lower)' },
  'front_delts': { pts: '92,150 112,157 112,178 92,172', muscle: 'Shoulders', label: 'Front Delts' },
  'side_delts': { pts: '85,157 92,150 92,172 85,170', muscle: 'Shoulders', label: 'Side Delts' },
  'biceps': { pts: '88,178 108,178 108,205 88,202', muscle: 'Biceps', label: 'Biceps' },
  'triceps': { pts: '78,172 88,178 88,205 78,202', muscle: 'Triceps', label: 'Triceps' },
  'forearms': { pts: '80,205 110,205 107,235 83,235', muscle: 'Forearms', label: 'Forearms' },
  'quads': { pts: '118,258 152,256 152,325 118,325', muscle: 'Quadriceps', label: 'Quads' },
  'calves_f': { pts: '122,370 148,370 148,405 122,405', muscle: 'Calves', label: 'Calves' },
  'core': { pts: '115,225 145,225 145,258 115,258', muscle: 'Abdominals', label: 'Abs' },
};

const BACK_REGIONS = {
  'upper_back': { pts: '318,155 358,152 358,188 318,185', muscle: 'Upper Back', label: 'Upper Back' },
  'lats': { pts: '312,183 358,180 362,235 308,235', muscle: 'Lats', label: 'Lats' },
  'lower_back': { pts: '315,233 358,233 358,260 315,260', muscle: 'Lower Back', label: 'Lower Back' },
  'traps': { pts: '318,128 358,125 358,155 318,155', muscle: 'Traps', label: 'Traps' },
  'rear_delts': { pts: '362,148 385,148 385,175 362,175', muscle: 'Shoulders', label: 'Rear Delts' },
  'biceps_b': { pts: '362,180 380,180 380,208 362,208', muscle: 'Biceps', label: 'Biceps' },
  'triceps_b': { pts: '380,178 395,178 395,205 380,205', muscle: 'Triceps', label: 'Triceps' },
  'forearms_b': { pts: '382,205 398,205 398,238 382,238', muscle: 'Forearms', label: 'Forearms' },
  'hamstrings': { pts: '318,272 358,272 358,328 318,328', muscle: 'Hamstrings', label: 'Hamstrings' },
  'glutes': { pts: '316,250 358,250 362,275 314,275', muscle: 'Glutes', label: 'Glutes' },
  'calves_b': { pts: '322,372 352,372 352,408 322,408', muscle: 'Calves', label: 'Calves' },
};

function heatColor(pct) {
  if (pct > 0.7) return '#e03040';
  if (pct > 0.4) return '#f08020';
  if (pct > 0.15) return '#7a5a10';
  return '#242938';
}

export default function BodyMap({ muscleGroups = [] }) {
  const volByMuscle = {};
  muscleGroups.forEach(m => { volByMuscle[m.name] = m.vol; });
  const maxVol = Math.max(1, ...muscleGroups.map(m => m.vol));

  const renderRegions = (regions) => Object.entries(regions).map(([key, { pts, muscle, label }]) => {
    const vol = volByMuscle[muscle] || 0;
    const pct = vol / maxVol;
    return (
      <polygon key={key} points={pts} fill={heatColor(pct)} stroke="var(--border2)" strokeWidth="0.7" opacity="0.9">
        <title>{label}: {Math.round(vol).toLocaleString('en-IN')} kg</title>
      </polygon>
    );
  });

  return (
    <div style={{ display: 'flex', gap: 30, justifyContent: 'center', flexWrap: 'wrap' }}>
      <div style={{ textAlign: 'center' }}>
        <svg width="200" height="430" viewBox="60 110 160 320">
          <ellipse cx="138" cy="130" rx="20" ry="24" fill="var(--card2)" stroke="var(--border2)" strokeWidth="1" />
          <path d="M118,152 Q116,228 120,260 Q122,340 126,408" fill="none" stroke="var(--card2)" strokeWidth="16" strokeLinecap="round" />
          <path d="M158,152 Q160,228 156,260 Q154,340 150,408" fill="none" stroke="var(--card2)" strokeWidth="14" strokeLinecap="round" />
          <path d="M118,152 Q92,164 80,178 Q72,200 82,242" fill="none" stroke="var(--card2)" strokeWidth="11" strokeLinecap="round" />
          <path d="M158,152 Q184,164 196,178 Q204,200 194,242" fill="none" stroke="var(--card2)" strokeWidth="11" strokeLinecap="round" />
          {renderRegions(FRONT_REGIONS)}
        </svg>
        <div className="statSub">FRONT</div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <svg width="170" height="430" viewBox="295 110 130 320">
          <ellipse cx="340" cy="128" rx="20" ry="24" fill="var(--card2)" stroke="var(--border2)" strokeWidth="1" />
          <path d="M318,148 Q316,228 320,260 Q322,340 326,408" fill="none" stroke="var(--card2)" strokeWidth="14" strokeLinecap="round" />
          <path d="M362,148 Q364,228 360,260 Q358,340 354,408" fill="none" stroke="var(--card2)" strokeWidth="12" strokeLinecap="round" />
          <path d="M318,148 Q294,160 284,175 Q276,200 286,242" fill="none" stroke="var(--card2)" strokeWidth="10" strokeLinecap="round" />
          <path d="M362,148 Q386,160 396,175 Q404,200 394,242" fill="none" stroke="var(--card2)" strokeWidth="10" strokeLinecap="round" />
          {renderRegions(BACK_REGIONS)}
        </svg>
        <div className="statSub">BACK</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 8, fontSize: 11 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 10, height: 10, background: '#e03040', borderRadius: 2 }} /> High volume (&gt;70%)</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 10, height: 10, background: '#f08020', borderRadius: 2 }} /> Medium (40-70%)</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 10, height: 10, background: '#7a5a10', borderRadius: 2 }} /> Low (15-40%)</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 10, height: 10, background: '#242938', borderRadius: 2, border: '1px solid var(--border2)' }} /> Minimal/none</div>
      </div>
    </div>
  );
}
