import { Injectable } from '@angular/core';
import { Group, Participant, GroupDistributionType } from '../models/tournament.models';

@Injectable({
  providedIn: 'root'
})
export class GroupGeneratorService {

  /**
   * Genera grupos según el tipo de distribución especificado
   * @param participants - Array de participantes ya mezclados
   * @param distributionType - Tipo de distribución a aplicar
   * @param numberOfGroups - Número total de grupos
   * @param minParticipantsPerGroup - Mínimo de participantes por grupo (solo para automático)
   * @returns Array de grupos generados
   */
  generateGroups(
    participants: Participant[],
    distributionType: GroupDistributionType,
    numberOfGroups: number,
    minParticipantsPerGroup: number
  ): Group[] {
    switch (distributionType) {
      case GroupDistributionType.SAME_NUMBER:
        return this.generateSameNumberGroups(participants, numberOfGroups);
      
      case GroupDistributionType.AUTOMATIC:
        return this.generateAutomaticGroups(participants, numberOfGroups, minParticipantsPerGroup);
      
      default:
        return [];
    }
  }

  /**
   * Genera grupos con el mismo número de participantes (o con diferencia de 1)
   * Distribuye los participantes de forma equitativa entre todos los grupos
   * @param participants - Array de participantes a distribuir
   * @param numberOfGroups - Número de grupos a crear
   * @returns Array de grupos con participantes distribuidos equitativamente
   */
  private generateSameNumberGroups(participants: Participant[], numberOfGroups: number): Group[] {
    const participantsPerGroup = Math.floor(participants.length / numberOfGroups);
    const remainder = participants.length % numberOfGroups;

    let currentIndex = 0;

    return Array.from({ length: numberOfGroups }, (_, i) => {
      const groupSize = participantsPerGroup + (i < remainder ? 1 : 0);
      const groupParticipants = participants.slice(currentIndex, currentIndex + groupSize);
      currentIndex += groupSize;

      return {
        id: i + 1,
        name: 'Grupo',
        participants: groupParticipants
      };
    });
  }

  /**
   * Genera grupos con distribución automática basada en un mínimo de participantes
   * Primero asigna el mínimo a cada grupo, luego distribuye los restantes de uno en uno
   * @param participants - Array de participantes a distribuir
   * @param numberOfGroups - Número de grupos a crear
   * @param minParticipantsPerGroup - Mínimo de participantes por grupo
   * @returns Array de grupos con distribución automática
   */
  private generateAutomaticGroups(
    participants: Participant[], 
    numberOfGroups: number, 
    minParticipantsPerGroup: number
  ): Group[] {
    const totalMinimum = minParticipantsPerGroup * numberOfGroups;
    
    if (participants.length < totalMinimum) {
      alert(`No hay suficientes participantes. Se necesitan al menos ${totalMinimum} participantes.`);
      return [];
    }

    let currentIndex = 0;

    // Inicializar grupos con el mínimo de participantes
    const groups: Group[] = Array.from({ length: numberOfGroups }, (_, i) => ({
      id: i + 1,
      name: 'Grupo',
      participants: participants.slice(currentIndex, currentIndex + minParticipantsPerGroup)
    }));

    currentIndex = numberOfGroups * minParticipantsPerGroup;

    // Distribuir participantes restantes de uno en uno
    let groupIndex = 0;
    while (currentIndex < participants.length) {
      groups[groupIndex].participants.push(participants[currentIndex]);
      currentIndex++;
      groupIndex = (groupIndex + 1) % numberOfGroups;
    }

    return groups;
  }

  /**
   * Asigna letras aleatorias a los grupos generados
   * Genera letras (A, B, C, etc.) y las mezcla aleatoriamente
   * @param groups - Grupos a renombrar
   * @returns Grupos con letras aleatorias asignadas
   */
  assignRandomLetters(groups: Group[]): void {
    const letters = Array.from(
      { length: groups.length }, 
      (_, i) => String.fromCharCode(65 + i)
    );
    
    const shuffledLetters = this.shuffleArray(letters);
    
    groups.forEach((group, index) => {
      group.name = `Grupo ${shuffledLetters[index]}`;
    });
  }

  /**
   * Mezcla aleatoriamente los elementos de un array
   * Utiliza el algoritmo Fisher-Yates
   * @param array - Array a mezclar
   * @returns Nuevo array con elementos mezclados
   */
  shuffleArray<T>(array: T[]): T[] {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  }
}
