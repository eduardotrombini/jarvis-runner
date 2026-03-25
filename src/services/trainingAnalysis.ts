import { Activity } from '../database/supabase';
import { getUserActivities } from '../database/userService';

export interface TrainingAnalysis {
  weekSummary: {
    totalRuns: number;
    totalDistance: number;
    totalTime: number;
    avgPace: number;
    avgHeartrate?: number;
    totalElevation: number;
  };
  level: 'iniciante' | 'intermediario' | 'avancado';
  strength: string[];
  weakness: string[];
  recommendations: TrainingRecommendation[];
}

export interface TrainingRecommendation {
  day: string;
  type: string;
  description: string;
  distance?: number;
  pace?: string;
  intensity: 'low' | 'medium' | 'high';
  reason: string;
}

export async function analyzeUserTraining(telegramId: number, daysBack: number = 30): Promise<TrainingAnalysis | null> {
  const activities = await getUserActivities(telegramId, daysBack);
  
  if (activities.length === 0) {
    return null;
  }

  const runs = activities.filter(a => a.type === 'Run' || a.type === 'Trail Run');
  
  if (runs.length === 0) {
    return null;
  }

  const weekRuns = runs.slice(0, 7);
  const totalDistance = runs.reduce((sum, a) => sum + (a.distance || 0), 0) / 1000;
  const totalTime = runs.reduce((sum, a) => sum + (a.moving_time || 0), 0) / 60;
  const avgPace = totalDistance > 0 ? (totalTime / totalDistance) : 0;
  const avgHeartrate = runs.reduce((sum, a) => sum + (a.average_heartrate || 0), 0) / runs.length;
  const totalElevation = runs.reduce((sum, a) => sum + (a.total_elevation_gain || 0), 0);

  const level = determineLevel(totalDistance, avgPace, runs.length);
  const { strength, weakness } = analyzeStrengthsWeaknesses(runs, avgPace, totalElevation);
  const recommendations = generateRecommendations(level, runs, strength, weakness);

  return {
    weekSummary: {
      totalRuns: weekRuns.length,
      totalDistance: weekRuns.reduce((sum, a) => sum + (a.distance || 0), 0) / 1000,
      totalTime: weekRuns.reduce((sum, a) => sum + (a.moving_time || 0), 0) / 60,
      avgPace: avgPace,
      avgHeartrate: avgHeartrate > 0 ? avgHeartrate : undefined,
      totalElevation: totalElevation,
    },
    level,
    strength,
    weakness,
    recommendations,
  };
}

function determineLevel(totalDistanceKm: number, avgPace: number, totalRuns: number): 'iniciante' | 'intermediario' | 'avancado' {
  if (totalDistanceKm < 30 || avgPace > 6.5) {
    return 'iniciante';
  } else if (totalDistanceKm < 80 || avgPace > 5) {
    return 'intermediario';
  }
  return 'avancado';
}

function analyzeStrengthsWeaknesses(runs: Activity[], avgPace: number, totalElevation: number): { strength: string[]; weakness: string[] } {
  const strength: string[] = [];
  const weakness: string[] = [];

  const avgDistance = runs.reduce((sum, a) => sum + (a.distance || 0), 0) / runs.length / 1000;
  
  if (avgPace < 5.5) {
    strength.push('Bom ritmo');
  } else if (avgPace > 6) {
    weakness.push('Ritmo precisa melhorar');
  }

  if (totalElevation / runs.length > 50) {
    strength.push('Boa capacidade de climbing');
  } else if (totalElevation / runs.length < 20) {
    weakness.push('Falta trabalho em elevação');
  }

  if (runs.length >= 4) {
    strength.push('Consistência');
  } else {
    weakness.push('Falta consistência');
  }

  if (avgDistance > 8) {
    strength.push('Boa resistência');
  } else if (avgDistance < 5) {
    weakness.push('Distâncias curtas');
  }

  const heartrateRuns = runs.filter(r => r.average_heartrate);
  if (heartrateRuns.length > 0) {
    const avgHR = heartrateRuns.reduce((sum, r) => sum + (r.average_heartrate || 0), 0) / heartrateRuns.length;
    if (avgHR < 150) {
      strength.push('Boa eficiência cardíaca');
    }
  }

  return { strength, weakness };
}

function generateRecommendations(
  level: 'iniciante' | 'intermediario' | 'avancado',
  recentRuns: Activity[],
  strengths: string[],
  weaknesses: string[]
): TrainingRecommendation[] {
  const recommendations: TrainingRecommendation[] = [];
  const days = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
  
  const lastRun = recentRuns[0];
  const avgDistance = recentRuns.reduce((sum, r) => sum + (r.distance || 0), 0) / recentRuns.length / 1000;

  const plan = getPlanForLevel(level, avgDistance, weaknesses);

  for (let i = 0; i < 7; i++) {
    const dayName = days[i];
    const isWeekend = i === 5 || i === 6;
    
    let workout = plan[i % plan.length];
    
    if (isWeekend && level !== 'iniciante') {
      workout = {
        type: 'Longão',
        description: `${Math.round(avgDistance * 1.3)}km em ritmo constante`,
        distance: Math.round(avgDistance * 1.3),
        pace: '5:30-6:00/km',
        intensity: 'medium' as const,
        reason: 'Treino longo do fim de semana para construir resistência',
      };
    }

    recommendations.push({
      day: dayName,
      ...workout,
    });
  }

  return recommendations;
}

function getPlanForLevel(
  level: 'iniciante' | 'intermediario' | 'avancado',
  avgDistance: number,
  weaknesses: string[]
) {
  const hasWeakness = (w: string) => weaknesses.some(weak => weak.toLowerCase().includes(w.toLowerCase()));

  if (level === 'iniciante') {
    return [
      { type: 'Descanso', description: 'Alongamento leve', intensity: 'low' as const, reason: 'Recuperação ativa' },
      { type: 'Corrida leve', description: '3-4km em ritmo confortável', distance: 4, pace: '6:00-6:30/km', intensity: 'low' as const, reason: 'Aeróbico leve' },
      { type: 'Descanso', description: 'Alongamento', intensity: 'low' as const, reason: 'Recuperação' },
      { type: 'Corrida leve', description: '4-5km em ritmo confortável', distance: 5, pace: '6:00-6:30/km', intensity: 'low' as const, reason: 'Construir base' },
      { type: 'Descanso', description: 'Alongamento', intensity: 'low' as const, reason: 'Recuperação' },
      { type: 'Corrida', description: '5-6km em ritmo moderado', distance: 6, pace: '5:45-6:00/km', intensity: 'medium' as const, reason: 'Aumentar volume' },
      { type: 'Descanso', description: 'Caminhada ou descanso total', intensity: 'low' as const, reason: 'Recuperação semanal' },
    ];
  }

  if (hasWeakness('elevação') || hasWeakness('climbing')) {
    return [
      { type: 'Intervalado', description: '6x800m com 400m trote', distance: 8, pace: '4:45-5:00/km', intensity: 'high' as const, reason: 'Treinar ritmo e elevação' },
      { type: 'Corrida leve', description: '6km em ritmo fácil', distance: 6, pace: '5:30-6:00/km', intensity: 'low' as const, reason: 'Recuperação' },
      { type: 'Subidas', description: '8x200m subida + descida', distance: 7, pace: 'ritmo variável', intensity: 'high' as const, reason: 'Ganhar força em subida' },
      { type: 'Corrida leve', description: '6km em ritmo fácil', distance: 6, pace: '5:30-6:00/km', intensity: 'low' as const, reason: 'Recuperação' },
      { type: 'Corrida ritmo', description: '8km em ritmo de prova', distance: 8, pace: '5:00-5:15/km', intensity: 'medium' as const, reason: 'Simular ritmo de prova' },
      { type: 'Longão', description: `${Math.round(avgDistance * 1.5)}km longo`, distance: Math.round(avgDistance * 1.5), pace: '5:30-6:00/km', intensity: 'medium' as const, reason: 'Buildar resistência' },
      { type: 'Descanso', description: 'Descanso total', intensity: 'low' as const, reason: 'Recuperação' },
    ];
  }

  if (level === 'intermediario') {
    return [
      { type: 'Intervalado', description: '6x800m com 400m trote', distance: 8, pace: '4:45-5:00/km', intensity: 'high' as const, reason: 'Melhorar VO2máx' },
      { type: 'Corrida leve', description: '6km em ritmo fácil', distance: 6, pace: '5:30-6:00/km', intensity: 'low' as const, reason: 'Recuperação ativa' },
      { type: 'Corrida ritmo', description: '10km em ritmo medium', distance: 10, pace: '5:00-5:15/km', intensity: 'medium' as const, reason: 'Treino de limiar' },
      { type: 'Corrida leve', description: '6km em ritmo fácil', distance: 6, pace: '5:30-6:00/km', intensity: 'low' as const, reason: 'Recuperação' },
      { type: 'Corrida progressiva', description: '8km progressivo', distance: 8, pace: '5:30 -> 4:45/km', intensity: 'medium' as const, reason: 'Treinar cambio de ritmo' },
      { type: 'Longão', description: `${Math.round(avgDistance * 1.5)}km longo`, distance: Math.round(avgDistance * 1.5), pace: '5:15-5:30/km', intensity: 'medium' as const, reason: 'Resistência' },
      { type: 'Descanso', description: 'Descanso total', intensity: 'low' as const, reason: 'Recuperação' },
    ];
  }

  return [
    { type: 'Intervalado', description: '10x400m com 200m trote', distance: 10, pace: '4:15-4:30/km', intensity: 'high' as const, reason: 'VO2máx' },
    { type: 'Corrida leve', description: '8km em ritmo fácil', distance: 8, pace: '5:15-5:30/km', intensity: 'low' as const, reason: 'Flush run' },
    { type: 'Tempo', description: '12km em ritmo meio', distance: 12, pace: '4:45-5:00/km', intensity: 'medium' as const, reason: 'Limiar' },
    { type: 'Corrida leve', description: '8km em ritmo fácil', distance: 8, pace: '5:15-5:30/km', intensity: 'low' as const, reason: 'Recuperação' },
    { type: 'Ritmo', description: '15km em ritmo constante', distance: 15, pace: '4:50-5:00/km', intensity: 'medium' as const, reason: 'Endurance' },
    { type: 'Longão', description: `${Math.round(avgDistance * 1.8)}km`, distance: Math.round(avgDistance * 1.8), pace: '5:00-5:15/km', intensity: 'medium' as const, reason: 'Resistência máxima' },
    { type: 'Descanso', description: 'Descanso total', intensity: 'low' as const, reason: 'Recuperação' },
  ];
}

export function formatAnalysisMessage(analysis: TrainingAnalysis): string {
  const { weekSummary, level, strength, weakness, recommendations } = analysis;

  let msg = `📊 *Análise dos Seus Treinos*\n\n`;
  msg += `*Resumo da Semana*\n`;
  msg += `🏃‍♂️ Corridas: ${weekSummary.totalRuns}\n`;
  msg += `📏 Distância: ${weekSummary.totalDistance.toFixed(1)} km\n`;
  msg += `⏱️ Tempo: ${Math.floor(weekSummary.totalTime)} min\n`;
  msg += `🏃‍♂️ Ritmo médio: ${weekSummary.avgPace.toFixed(2)}/km\n`;
  if (weekSummary.avgHeartrate) {
    msg += `💓 FC média: ${Math.round(weekSummary.avgHeartrate)} bpm\n`;
  }
  msg += `📈 Elevação: ${weekSummary.totalElevation.toFixed(0)} m\n\n`;

  msg += `*Nível:* ${level === 'iniciante' ? '🦉 Iniciante' : level === 'intermediario' ? '🔥 Intermediário' : '⚡ Avançado'}\n\n`;

  if (strength.length > 0) {
    msg += `*Pontos fortes:* ${strength.join(', ')}\n`;
  }
  if (weakness.length > 0) {
    msg += `*Pontos a melhorar:* ${weakness.join(', ')}\n`;
  }

  return msg;
}

export function formatWeeklyPlan(recommendations: TrainingRecommendation[]): string {
  let msg = `\n📅 *Plano de Treino da Semana*\n\n`;

  for (const rec of recommendations) {
    const emoji = rec.intensity === 'high' ? '🔴' : rec.intensity === 'medium' ? '🟡' : '🟢';
    msg += `${emoji} *${rec.day}*: ${rec.type}\n`;
    if (rec.distance) {
      msg += `   📏 ${rec.distance}km | ${rec.pace || ''}\n`;
    }
    msg += `   ${rec.description}\n\n`;
  }

  return msg;
}
