import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Category, Participant, GroupDistributionType, GroupSettings, Tournament, Group } from './models/tournament.models';
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
        name: `Grupo ${i + 1}`,
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
}

