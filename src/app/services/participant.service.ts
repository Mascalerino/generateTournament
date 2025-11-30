import { Injectable } from '@angular/core';
import { Participant } from '../models/tournament.models';

@Injectable({
  providedIn: 'root'
})
export class ParticipantService {

  /**
   * Genera el siguiente ID disponible para un participante
   * @param participants - Lista actual de participantes
   * @returns Siguiente ID único
   */
  getNextId(participants: Participant[]): number {
    return participants.length > 0 
      ? Math.max(...participants.map(p => p.id)) + 1 
      : 1;
  }

  /**
   * Parsea el nombre de un participante extrayendo categoría y estado de pago
   * @param input - Texto con formato: Nombre (categoría)(P)
   * @returns Objeto con nombre, categoría e isPaid
   */
  parseParticipantName(input: string): { name: string; categoryId: number; isPaid: boolean } {
    const pattern = /\(([1-5])?\s*([P])?\)\s*$/i;
    const match = input.match(pattern);
    
    if (!match) {
      return { name: input, categoryId: 1, isPaid: false };
    }

    const categoryId = match[1] ? parseInt(match[1]) : 1;
    const isPaid = !!match[2];
    const name = input.replace(pattern, '').trim();

    return { name, categoryId, isPaid };
  }

  /**
   * Procesa un texto con múltiples nombres y genera participantes
   * @param bulkText - Texto con nombres separados por comas o saltos de línea
   * @param participants - Lista actual de participantes
   * @returns Array de nuevos participantes a añadir
   */
  parseBulkParticipants(bulkText: string, participants: Participant[]): Participant[] {
    const trimmedInput = bulkText.trim();
    if (!trimmedInput) return [];

    const names = trimmedInput
      .split(/[,\n]/)
      .map(name => name.trim())
      .filter(name => name.length > 0);

    let nextId = this.getNextId(participants);

    return names.map(name => {
      const parsed = this.parseParticipantName(name);
      return {
        id: nextId++,
        name: parsed.name,
        categoryId: parsed.categoryId,
        isPaid: parsed.isPaid
      };
    });
  }

  /**
   * Mezcla aleatoriamente un array de participantes
   * Utiliza el algoritmo Fisher-Yates
   * @param participants - Array de participantes a mezclar
   * @returns Nuevo array con participantes mezclados
   */
  shuffleParticipants(participants: Participant[]): Participant[] {
    const newArray = [...participants];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  }
}
