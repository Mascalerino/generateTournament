import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Category, Participant, GroupDistributionType, GroupSettings, Tournament } from './models/tournament.models';

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
  manualGroupSizes: number[] = [];

  // Datos de participantes
  participants: Participant[] = [];
  newParticipantName: string = '';
  selectedCategoryId: number = 1;
  editingParticipantId: number | null = null;
  editingParticipantName: string = '';
  
  // Datos de participantes masivos
  bulkParticipantNames: string = '';
  bulkCategoryId: number = 1;
  showBulkInput: boolean = false;

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
    if (this.distributionType === GroupDistributionType.MANUAL) {
      this.updateManualGroupSizes();
    }
  }

  onNumberOfGroupsChange() {
    if (this.distributionType === GroupDistributionType.MANUAL) {
      this.updateManualGroupSizes();
    }
  }

  updateManualGroupSizes() {
    this.manualGroupSizes = Array(this.numberOfGroups).fill(1);
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
  }

  saveEditParticipant(participant: Participant) {
    if (this.editingParticipantName.trim()) {
      participant.name = this.editingParticipantName.trim();
    }
    this.cancelEdit();
  }

  cancelEdit() {
    this.editingParticipantId = null;
    this.editingParticipantName = '';
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
      // Detectar si tiene (P) al final para marcar como pagado
      let isPaid = false;
      let cleanName = name;
      
      // Buscar (P) al final del nombre (ignorando espacios)
      const paidMatch = name.match(/\(P\)\s*$/i);
      if (paidMatch) {
        isPaid = true;
        // Remover (P) del nombre
        cleanName = name.replace(/\(P\)\s*$/i, '').trim();
      }

      this.participants.push({
        id: nextId++,
        name: cleanName,
        categoryId: this.bulkCategoryId,
        isPaid: isPaid
      });
    });

    // Limpiar el textarea
    this.bulkParticipantNames = '';
  }
}

