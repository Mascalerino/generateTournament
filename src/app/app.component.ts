import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Category, Participant, GroupDistributionType, GroupSettings, Tournament, Group, Match, GroupStanding } from './models/tournament.models';
import jsPDF from 'jspdf';

@Component({
  selector: 'app-root',
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  // Datos generales
  tournamentName: string = '';
  numberOfCategories: number = 1;
  categories: Category[] = [];
  mixedGroups: boolean = false;

  // Datos de grupos
  numberOfGroups: number = 1;
  distributionType: GroupDistributionType = GroupDistributionType.SAME_NUMBER;
  minParticipantsPerGroup: number = 2;

  // Datos de participantes
  participants: Participant[] = [];
  newParticipantName: string = '';
  selectedCategoryId: number = 1;
  editingParticipantId: number | null = null;
  editingParticipantName: string = '';
  editingParticipantCategoryId: number = 1;
  
  // Datos de participantes masivos
  bulkParticipantNames: string = '';
  bulkCategoryId: number = 1;
  showBulkInput: boolean = false;

  // Grupos generados
  generatedGroups: Group[] = [];
  showGroups: boolean = false;

  // Partidos y clasificaciones
  groupMatches: Map<number, Match[]> = new Map();
  groupStandings: Map<number, GroupStanding[]> = new Map();

  // Control de colapso de secciones
  isGeneralDataCollapsed: boolean = false;
  isGroupDataCollapsed: boolean = false;
  isParticipantDataCollapsed: boolean = false;
  isGeneratedGroupsCollapsed: boolean = false;
  isMatchManagementCollapsed: boolean = false;

  // Enums para template
  GroupDistributionType = GroupDistributionType;

  ngOnInit() {
    this.updateCategories();
  }

  // Métodos para categorías
  onNumberOfCategoriesChange() {
    this.updateCategories();
  }

  updateCategories() {
    const currentCategories = [...this.categories];
    this.categories = [];
    
    for (let i = 1; i <= this.numberOfCategories; i++) {
      const existing = currentCategories.find(c => c.id === i);
      this.categories.push({
        id: i,
        name: existing ? existing.name : `Categoría ${i}`
      });
    }
    
    // Actualizar selectedCategoryId si es necesario
    if (this.selectedCategoryId > this.numberOfCategories) {
      this.selectedCategoryId = 1;
    }
  }

  // Métodos para grupos
  onDistributionTypeChange() {
    // Método para futuras validaciones si es necesario
  }

  onNumberOfGroupsChange() {
    // Método para futuras validaciones si es necesario
  }

  // Métodos para participantes
  addParticipant() {
    if (this.newParticipantName.trim()) {
      const newId = this.participants.length > 0 
        ? Math.max(...this.participants.map(p => p.id)) + 1 
        : 1;
      
      this.participants.push({
        id: newId,
        name: this.newParticipantName.trim(),
        categoryId: this.selectedCategoryId,
        isPaid: false
      });
      
      this.newParticipantName = '';
    }
  }

  startEditParticipant(participant: Participant) {
    this.editingParticipantId = participant.id;
    this.editingParticipantName = participant.name;
    this.editingParticipantCategoryId = participant.categoryId;
  }

  saveEditParticipant(participant: Participant) {
    if (this.editingParticipantName.trim()) {
      participant.name = this.editingParticipantName.trim();
      participant.categoryId = this.editingParticipantCategoryId;
    }
    this.cancelEdit();
  }

  cancelEdit() {
    this.editingParticipantId = null;
    this.editingParticipantName = '';
    this.editingParticipantCategoryId = 1;
  }

  deleteParticipant(id: number) {
    this.participants = this.participants.filter(p => p.id !== id);
  }

  deleteAllParticipants() {
    if (confirm('¿Está seguro de que desea eliminar todos los participantes?')) {
      this.participants = [];
    }
  }

  togglePaid(participant: Participant) {
    participant.isPaid = !participant.isPaid;
  }

  getCategoryName(categoryId: number): string {
    const category = this.categories.find(c => c.id === categoryId);
    return category ? category.name : `Categoría ${categoryId}`;
  }

  // Métodos para participantes masivos
  toggleBulkInput() {
    this.showBulkInput = !this.showBulkInput;
  }

  addBulkParticipants() {
    if (!this.bulkParticipantNames.trim()) {
      return;
    }

    // Separar por comas o saltos de línea
    const names = this.bulkParticipantNames
      .split(/[,\n]/) // Separar por comas o saltos de línea
      .map(name => name.trim()) // Quitar espacios
      .filter(name => name.length > 0); // Filtrar vacíos

    let nextId = this.participants.length > 0 
      ? Math.max(...this.participants.map(p => p.id)) + 1 
      : 1;

    // Añadir cada participante
    names.forEach(name => {
      let isPaid = false;
      let categoryId = 1; // Categoría por defecto
      let cleanName = name;
      
      // Buscar patrones entre paréntesis al final: (1), (2P), (P), (3 P), etc.
      const pattern = /\(([1-5])?\s*([P])?\)\s*$/i;
      const match = name.match(pattern);
      
      if (match) {
        // Si hay número de categoría (1-5)
        if (match[1]) {
          const catNum = parseInt(match[1]);
          if (catNum >= 1 && catNum <= 5) {
            categoryId = catNum;
          }
        }
        
        // Si tiene P (pagado)
        if (match[2]) {
          isPaid = true;
        }
        
        // Remover el patrón del nombre
        cleanName = name.replace(pattern, '').trim();
      }

      this.participants.push({
        id: nextId++,
        name: cleanName,
        categoryId: categoryId,
        isPaid: isPaid
      });
    });

    // Limpiar el textarea
    this.bulkParticipantNames = '';
  }

  // Métodos para generar grupos
  canGenerateGroups(): boolean {
    return this.participants.length > 0;
  }

  generateGroups() {
    if (!this.canGenerateGroups()) {
      alert('No hay participantes para generar grupos.');
      return;
    }

    // Mezclar participantes aleatoriamente
    const shuffledParticipants = this.shuffleArray([...this.participants]);

    if (this.mixedGroups) {
      // TODO: Implementar lógica de grupos mezclados
      this.generatedGroups = this.generateMixedGroups(shuffledParticipants);
    } else {
      this.generatedGroups = this.generateRegularGroups(shuffledParticipants);
    }

    this.showGroups = true;
    this.initializeMatchesAndStandings();
  }

  private initializeMatchesAndStandings() {
    this.groupMatches.clear();
    this.groupStandings.clear();

    this.generatedGroups.forEach(group => {
      // Generar partidos para cada grupo
      const matches: Match[] = [];
      let matchId = 0;
      
      for (let i = 0; i < group.participants.length; i++) {
        for (let j = i + 1; j < group.participants.length; j++) {
          matches.push({
            id: matchId++,
            participant1Id: group.participants[i].id,
            participant2Id: group.participants[j].id,
            score1: 0,
            score2: 0,
            winner: null
          });
        }
      }
      
      this.groupMatches.set(group.id, matches);

      // Inicializar clasificación
      const standings: GroupStanding[] = group.participants.map(p => ({
        participantId: p.id,
        wins: 0,
        goalDifference: 0
      }));
      
      this.groupStandings.set(group.id, standings);
    });
  }

  private generateRegularGroups(participants: Participant[]): Group[] {
    const groups: Group[] = [];

    switch (this.distributionType) {
      case GroupDistributionType.SAME_NUMBER:
        return this.generateSameNumberGroups(participants);
      
      case GroupDistributionType.AUTOMATIC:
        return this.generateAutomaticGroups(participants);
      
      default:
        return groups;
    }
  }

  private generateSameNumberGroups(participants: Participant[]): Group[] {
    const groups: Group[] = [];
    const participantsPerGroup = Math.floor(participants.length / this.numberOfGroups);
    const remainder = participants.length % this.numberOfGroups;

    let currentIndex = 0;

    for (let i = 0; i < this.numberOfGroups; i++) {
      const group: Group = {
        id: i + 1,
        name: `Grupo ${i + 1}`,
        participants: []
      };

      // Añadir participantes base
      const groupSize = participantsPerGroup + (i < remainder ? 1 : 0);
      
      for (let j = 0; j < groupSize; j++) {
        if (currentIndex < participants.length) {
          group.participants.push(participants[currentIndex]);
          currentIndex++;
        }
      }

      groups.push(group);
    }

    return groups;
  }

  private generateAutomaticGroups(participants: Participant[]): Group[] {
    const groups: Group[] = [];
    const totalMinimum = this.minParticipantsPerGroup * this.numberOfGroups;
    
    if (participants.length < totalMinimum) {
      alert(`No hay suficientes participantes. Se necesitan al menos ${totalMinimum} participantes.`);
      return groups;
    }

    let currentIndex = 0;

    // Inicializar grupos con el mínimo de participantes
    for (let i = 0; i < this.numberOfGroups; i++) {
      const group: Group = {
        id: i + 1,
        name: 'Grupo',
        participants: []
      };

      // Añadir mínimo de participantes
      for (let j = 0; j < this.minParticipantsPerGroup; j++) {
        if (currentIndex < participants.length) {
          group.participants.push(participants[currentIndex]);
          currentIndex++;
        }
      }

      groups.push(group);
    }

    // Distribuir participantes restantes de uno en uno
    let groupIndex = 0;
    while (currentIndex < participants.length) {
      groups[groupIndex].participants.push(participants[currentIndex]);
      currentIndex++;
      groupIndex = (groupIndex + 1) % this.numberOfGroups;
    }

    return groups;
  }

  private generateMixedGroups(participants: Participant[]): Group[] {
    // TODO: Implementar lógica de grupos mezclados por categoría
    return this.generateRegularGroups(participants);
  }

  private shuffleArray<T>(array: T[]): T[] {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  }

  // Métodos para partidos y clasificación
  getGroupMatches(groupId: number): Match[] {
    return this.groupMatches.get(groupId) || [];
  }

  getGroupStandings(groupId: number): GroupStanding[] {
    return this.groupStandings.get(groupId) || [];
  }

  getParticipantById(participantId: number): Participant | undefined {
    return this.participants.find(p => p.id === participantId);
  }

  getStandingForParticipant(groupId: number, participantId: number): GroupStanding | undefined {
    const standings = this.getGroupStandings(groupId);
    return standings.find(s => s.participantId === participantId);
  }

  onMatchWinnerChange(groupId: number, match: Match, winner: number) {
    if (match.winner === winner) {
      match.winner = null;
    } else {
      match.winner = winner;
    }
    this.updateGroupStandings(groupId);
  }

  onMatchScoreChange(groupId: number, match: Match) {
    // Actualizar clasificación cuando cambian los marcadores
    this.updateGroupStandings(groupId);
  }

  private updateGroupStandings(groupId: number) {
    const matches = this.getGroupMatches(groupId);
    const standings = this.getGroupStandings(groupId);

    // Resetear estadísticas
    standings.forEach(s => {
      s.wins = 0;
      s.goalDifference = 0;
    });

    // Calcular estadísticas basadas en los partidos
    matches.forEach(match => {
      if (match.winner !== null) {
        const winnerId = match.winner === 1 ? match.participant1Id : match.participant2Id;
        const winnerStanding = standings.find(s => s.participantId === winnerId);
        if (winnerStanding) {
          winnerStanding.wins++;
        }
      }

      // Calcular diferencia de goles si hay un ganador marcado
      if (match.winner !== null) {
        const standing1 = standings.find(s => s.participantId === match.participant1Id);
        const standing2 = standings.find(s => s.participantId === match.participant2Id);
        
        if (standing1 && standing2) {
          const diff = match.score1 - match.score2;
          standing1.goalDifference += diff;
          standing2.goalDifference -= diff;
        }
      }
    });

    // Ordenar por victorias y luego por diferencia de goles
    const sortedStandings = standings.sort((a, b) => {
      if (b.wins !== a.wins) {
        return b.wins - a.wins;
      }
      return b.goalDifference - a.goalDifference;
    });

    // Actualizar el Map con el array ordenado
    this.groupStandings.set(groupId, sortedStandings);
  }

  // Método para exportar a PDF
  exportToPDF() {
    const doc = new jsPDF({ orientation: 'landscape' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    let yPosition = margin;

    // Título del documento
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    const title = this.tournamentName || 'Grupos del Torneo';
    doc.text(title, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;

    // Calcular cuántos grupos caben por fila
    const groupsPerRow = this.generatedGroups.length <= 2 ? this.generatedGroups.length : 3;
    const columnWidth = (pageWidth - 2 * margin) / groupsPerRow;
    const groupSpacing = 10;

    let currentColumn = 0;
    let maxYInRow = yPosition;

    this.generatedGroups.forEach((group, index) => {
      const xPosition = margin + (currentColumn * columnWidth);
      let groupY = yPosition;

      // Título del grupo
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(group.name, xPosition + columnWidth / 2, groupY, { align: 'center' });
      groupY += 8;

      // Línea separadora
      doc.setLineWidth(0.5);
      doc.line(xPosition, groupY, xPosition + columnWidth - 5, groupY);
      groupY += 6;

      // Participantes
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      group.participants.forEach((participant, i) => {
        const categoryName = this.getCategoryName(participant.categoryId);
        const participantText = `${i + 1}. ${participant.name}`;
        
        doc.text(participantText, xPosition + 2, groupY);
        
        // Badge de categoría
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(`(${categoryName})`, xPosition + columnWidth - 30, groupY);
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        
        groupY += 6;

        // Verificar si necesitamos una nueva página
        if (groupY > pageHeight - margin) {
          doc.addPage();
          groupY = margin;
          yPosition = margin;
          currentColumn = 0;
          maxYInRow = yPosition;
        }
      });

      // Actualizar la posición Y máxima en esta fila
      maxYInRow = Math.max(maxYInRow, groupY);

      currentColumn++;

      // Si hemos completado una fila, pasar a la siguiente
      if (currentColumn >= groupsPerRow) {
        currentColumn = 0;
        yPosition = maxYInRow + groupSpacing;
      }
    });

    // Guardar el PDF
    const fileName = this.tournamentName 
      ? `${this.tournamentName.replace(/\s+/g, '_')}_grupos.pdf` 
      : 'grupos_torneo.pdf';
    doc.save(fileName);
  }

  // Método para asignar letras aleatorias a los grupos
  assignRandomLetters() {
    // Generar un array de letras disponibles según el número de grupos
    const letters: string[] = [];
    for (let i = 0; i < this.generatedGroups.length; i++) {
      letters.push(String.fromCharCode(65 + i)); // A, B, C, D, ...
    }
    
    // Mezclar las letras aleatoriamente
    const shuffledLetters = this.shuffleArray(letters);
    
    // Asignar las letras mezcladas a los grupos
    this.generatedGroups.forEach((group, index) => {
      group.name = `Grupo ${shuffledLetters[index]}`;
    });
  }

  // Método para exportar PDF detallado (una página por grupo)
  exportDetailedPDF() {
    const doc = new jsPDF({ orientation: 'portrait' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;

    this.generatedGroups.forEach((group, groupIndex) => {
      if (groupIndex > 0) {
        doc.addPage();
      }

      let yPosition = margin;

      // Título del grupo
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Grupo', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;

      // Línea separadora
      doc.setLineWidth(0.5);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 10;

      // Encabezados de la tabla de participantes (3 columnas más pequeñas)
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Participantes', margin, yPosition);
      doc.text('Vic.', pageWidth - margin - 60, yPosition);
      doc.text('D.G.', pageWidth - margin - 40, yPosition);
      doc.text('Clas.', pageWidth - margin - 18, yPosition);
      yPosition += 8;

      // Línea de encabezado
      doc.setLineWidth(0.3);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 8;

      // Lista de participantes con espacio para victorias, diferencia de goles y clasificación
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      
      group.participants.forEach((participant, index) => {
        const participantText = `${index + 1}. ${participant.name}`;
        
        // Nombre del participante
        doc.text(participantText, margin + 2, yPosition);
        
        // Líneas verticales para separar columnas
        const victoryLineX = pageWidth - margin - 63;
        const goalsLineX = pageWidth - margin - 43;
        const classLineX = pageWidth - margin - 21;
        
        doc.setLineWidth(0.2);
        doc.line(victoryLineX, yPosition - 5, victoryLineX, yPosition + 2);
        doc.line(goalsLineX, yPosition - 5, goalsLineX, yPosition + 2);
        doc.line(classLineX, yPosition - 5, classLineX, yPosition + 2);
        
        // Líneas horizontales para escribir victorias, diferencia de goles y clasificación
        doc.line(pageWidth - margin - 60, yPosition, pageWidth - margin - 45, yPosition);
        doc.line(pageWidth - margin - 40, yPosition, pageWidth - margin - 24, yPosition);
        doc.line(pageWidth - margin - 18, yPosition, pageWidth - margin - 5, yPosition);
        
        yPosition += 10;
      });

      yPosition += 10;

      // Título de enfrentamientos
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Enfrentamientos', margin, yPosition);
      yPosition += 10;

      // Línea separadora
      doc.setLineWidth(0.5);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 8;

      // Generar todos los enfrentamientos (cada pareja solo una vez)
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      
      const matches: string[] = [];
      for (let i = 0; i < group.participants.length; i++) {
        for (let j = i + 1; j < group.participants.length; j++) {
          const participant1 = group.participants[i];
          const participant2 = group.participants[j];
          matches.push(`${participant1.name} vs ${participant2.name}`);
        }
      }

      // Mostrar enfrentamientos en lista con línea para resultado
      matches.forEach((match, index) => {
        const matchY = yPosition + (index * 8);

        // Verificar si necesitamos advertir sobre espacio
        if (matchY > pageHeight - margin - 10) {
          doc.setFontSize(8);
          doc.setTextColor(255, 0, 0);
          doc.text('(Continúa en página adicional)', margin, pageHeight - 10);
          return;
        }

        doc.setTextColor(0, 0, 0);
        
        // Texto del enfrentamiento
        doc.text(`${index + 1}. ${match}`, margin + 2, matchY);
        
        // Línea para anotar el resultado
        const resultLineStart = pageWidth - margin - 40;
        doc.setLineWidth(0.2);
        doc.line(resultLineStart, matchY, pageWidth - margin - 5, matchY);
      });
    });

    // Guardar el PDF
    const fileName = this.tournamentName 
      ? `${this.tournamentName.replace(/\s+/g, '_')}_detallado.pdf` 
      : 'grupos_detallado.pdf';
    doc.save(fileName);
  }
}

