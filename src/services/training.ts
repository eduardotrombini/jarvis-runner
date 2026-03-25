export interface Training {
  type: string;
  description: string;
  distance?: number;
  duration?: number;
  intensity: 'low' | 'medium' | 'high';
  pace?: string;
  heartrateZone?: string;
}

const trainingPlans = {
  easy: [
    { type: 'Corrida leve', distance: 5, intensity: 'low' as const, pace: '5:30-6:00/km', heartrateZone: 'Zona 1-2' },
    { type: 'Corrida leve', distance: 6, intensity: 'low' as const, pace: '5:30-6:00/km', heartrateZone: 'Zona 1-2' },
    { type: 'Corrida leve', distance: 8, intensity: 'low' as const, pace: '5:30-6:00/km', heartrateZone: 'Zona 1-2' },
  ],
  tempo: [
    { type: 'Corrida ritmo', distance: 8, intensity: 'medium' as const, pace: '5:00-5:15/km', heartrateZone: 'Zona 3' },
    { type: 'Intervalado', distance: 10, intensity: 'high' as const, pace: '4:45-5:00/km', heartrateZone: 'Zona 4' },
    { type: 'Longão', distance: 15, intensity: 'medium' as const, pace: '5:15-5:30/km', heartrateZone: 'Zona 2-3' },
  ],
};

export function generateDailyTraining(plan: 'easy' | 'tempo' = 'easy'): Training {
  const dayOfWeek = new Date().getDay();
  
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return {
      type: 'Descanso ativo',
      description: 'Alongamento ou caminhada leve',
      intensity: 'low',
    };
  }

  const plans = trainingPlans[plan];
  const index = dayOfWeek % plans.length;
  const base = plans[index];

  return {
    type: base.type,
    description: `${base.distance}km em ritmo ${base.pace}`,
    distance: base.distance,
    intensity: base.intensity,
    pace: base.pace,
    heartrateZone: base.heartrateZone,
  };
}

export function formatTrainingMessage(training: Training): string {
  return `🏃 *Treino de Hoje*

${training.type}

${training.description}

${training.pace ? `⏱️ Ritmo: ${training.pace}` : ''}
${training.heartrateZone ? `💓 FC: ${training.heartrateZone}` : ''}
🔴 Intensidade: ${training.intensity.toUpperCase()}`;
}
