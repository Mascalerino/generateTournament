import { Injectable } from '@angular/core';
import { Match, GroupStanding, Participant, Group } from '../models/tournament.models';

@Injectable({
  providedIn: 'root'
})
export class MatchManagementService {

  /**
   * Genera todos los partidos posibles para un grupo (todos contra todos)
   * @param participants - Participantes del grupo
   * @returns Array de partidos generados
   */
  generateMatches(participants: Participant[]): Match[] {
    const matches: Match[] = [];
    let matchId = 0;
    
    for (let i = 0; i < participants.length; i++) {
      for (let j = i + 1; j < participants.length; j++) {
        matches.push({
          id: matchId++,
          participant1Id: participants[i].id,
          participant2Id: participants[j].id,
          score1: 0,
          score2: 0,
          winner: null
        });
      }
    }
    
    return matches;
  }

  /**
   * Inicializa las estadísticas de clasificación para un grupo
   * @param participants - Participantes del grupo
   * @returns Array de clasificación inicializado
   */
  initializeStandings(participants: Participant[]): GroupStanding[] {
    return participants.map(p => ({
      participantId: p.id,
      wins: 0,
      goalDifference: 0
    }));
  }

  /**
   * Actualiza la clasificación de un grupo basándose en los resultados de los partidos
   * Calcula victorias y diferencia de goles para cada participante
   * Ordena por victorias (descendente) y diferencia de goles (descendente)
   * @param matches - Partidos del grupo
   * @param standings - Clasificación actual del grupo
   * @returns Clasificación actualizada y ordenada
   */
  updateStandings(matches: Match[], standings: GroupStanding[]): GroupStanding[] {
    // Crear un Map para búsquedas O(1) en lugar de O(n)
    const standingsMap = new Map(standings.map(s => [s.participantId, s]));

    // Resetear estadísticas
    standings.forEach(s => {
      s.wins = 0;
      s.goalDifference = 0;
    });

    // Calcular estadísticas basadas en los partidos
    matches.forEach(match => {
      if (match.winner === null) return;

      const winnerId = match.winner === 1 ? match.participant1Id : match.participant2Id;
      const winnerStanding = standingsMap.get(winnerId);
      if (winnerStanding) {
        winnerStanding.wins++;
      }

      // Calcular diferencia de goles
      const standing1 = standingsMap.get(match.participant1Id);
      const standing2 = standingsMap.get(match.participant2Id);
      
      if (standing1 && standing2) {
        const diff = match.score1 - match.score2;
        standing1.goalDifference += diff;
        standing2.goalDifference -= diff;
      }
    });

    // Ordenar por victorias y luego por diferencia de goles
    standings.sort((a, b) => {
      if (b.wins !== a.wins) {
        return b.wins - a.wins;
      }
      return b.goalDifference - a.goalDifference;
    });

    return standings;
  }

  /**
   * Inicializa partidos y clasificaciones para todos los grupos
   * @param groups - Grupos generados
   * @returns Objeto con Maps de partidos y clasificaciones por grupo
   */
  initializeMatchesAndStandings(groups: Group[]): {
    matches: Map<number, Match[]>,
    standings: Map<number, GroupStanding[]>
  } {
    const matchesMap = new Map<number, Match[]>();
    const standingsMap = new Map<number, GroupStanding[]>();

    groups.forEach(group => {
      matchesMap.set(group.id, this.generateMatches(group.participants));
      standingsMap.set(group.id, this.initializeStandings(group.participants));
    });

    return {
      matches: matchesMap,
      standings: standingsMap
    };
  }
}
