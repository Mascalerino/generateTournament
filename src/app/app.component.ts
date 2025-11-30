import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Category, Participant, GroupDistributionType, GroupSettings, Tournament, Group, Match, GroupStanding } from './models/tournament.models';
import { PdfExportService } from './services/pdf-export.service';
import { GroupGeneratorService } from './services/group-generator.service';
import { MatchManagementService } from './services/match-management.service';
import { ParticipantService } from './services/participant.service';

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

  constructor(
    private pdfExportService: PdfExportService,
    private groupGeneratorService: GroupGeneratorService,
    private matchManagementService: MatchManagementService,
    private participantService: ParticipantService
  ) {}

  /**
   * Inicializa el componente al cargarse
   * Actualiza las categorías disponibles
   */
  ngOnInit() {
    this.updateCategories();
  }

  // Métodos para categorías
  
  /**
   * Se ejecuta cuando cambia el número de categorías seleccionadas
   * Actualiza el array de categorías disponibles
   */
  onNumberOfCategoriesChange() {
    this.updateCategories();
  }

  /**
   * Actualiza el array de categorías basándose en el número seleccionado
   * Preserva los nombres de categorías existentes si ya estaban creadas
   * Ajusta selectedCategoryId si es necesario
   */
  updateCategories() {
    const currentCategories = [...this.categories];
    
    this.categories = Array.from({ length: this.numberOfCategories }, (_, i) => {
      const id = i + 1;
      const existing = currentCategories.find(c => c.id === id);
      return {
        id,
        name: existing?.name ?? `Categoría ${id}`
      };
    });
    
    // Actualizar selectedCategoryId si es necesario
    if (this.selectedCategoryId > this.numberOfCategories) {
      this.selectedCategoryId = 1;
    }
  }

  // Métodos para grupos
  
  /**
   * Se ejecuta cuando cambia el tipo de distribución de grupos
   * Preparado para futuras validaciones
   */
  onDistributionTypeChange() {
    // Método para futuras validaciones si es necesario
  }

  /**
   * Se ejecuta cuando cambia el número de grupos
   * Preparado para futuras validaciones
   */
  onNumberOfGroupsChange() {
    // Método para futuras validaciones si es necesario
  }

  // Métodos para participantes
  
  /**
   * Añade un nuevo participante a la lista
   * Genera un ID único y resetea el campo de entrada
   */
  addParticipant() {
    const trimmedName = this.newParticipantName.trim();
    if (!trimmedName) return;
    
    this.participants.push({
      id: this.participantService.getNextId(this.participants),
      name: trimmedName,
      categoryId: this.selectedCategoryId,
      isPaid: false
    });
    
    this.newParticipantName = '';
  }

  /**
   * Inicia el modo de edición para un participante
   * Guarda los datos actuales del participante en variables temporales
   */
  startEditParticipant(participant: Participant) {
    this.editingParticipantId = participant.id;
    this.editingParticipantName = participant.name;
    this.editingParticipantCategoryId = participant.categoryId;
  }

  /**
   * Guarda los cambios realizados a un participante
   * Actualiza el nombre y categoría si el nombre no está vacío
   */
  saveEditParticipant(participant: Participant) {
    if (this.editingParticipantName.trim()) {
      participant.name = this.editingParticipantName.trim();
      participant.categoryId = this.editingParticipantCategoryId;
    }
    this.cancelEdit();
  }

  /**
   * Cancela la edición de un participante
   * Resetea las variables temporales de edición
   */
  cancelEdit() {
    this.editingParticipantId = null;
    this.editingParticipantName = '';
    this.editingParticipantCategoryId = 1;
  }

  /**
   * Elimina un participante de la lista
   * @param id - ID del participante a eliminar
   */
  deleteParticipant(id: number) {
    this.participants = this.participants.filter(p => p.id !== id);
  }

  /**
   * Elimina todos los participantes después de confirmar
   * Muestra un diálogo de confirmación antes de proceder
   */
  deleteAllParticipants() {
    if (confirm('¿Está seguro de que desea eliminar todos los participantes?')) {
      this.participants = [];
    }
  }

  /**
   * Alterna el estado de pago de un participante
   * @param participant - Participante cuyo estado se va a cambiar
   */
  togglePaid(participant: Participant) {
    participant.isPaid = !participant.isPaid;
  }

  /**
   * Obtiene el nombre de una categoría por su ID
   * @param categoryId - ID de la categoría
   * @returns Nombre de la categoría o un nombre por defecto
   */
  getCategoryName(categoryId: number): string {
    const category = this.categories.find(c => c.id === categoryId);
    return category ? category.name : `Categoría ${categoryId}`;
  }

  // Métodos para participantes masivos
  
  /**
   * Muestra u oculta el formulario de añadir participantes masivamente
   */
  toggleBulkInput() {
    this.showBulkInput = !this.showBulkInput;
  }

  /**
   * Añade múltiples participantes a la vez desde un texto
   * Procesa nombres separados por comas o saltos de línea
   * Soporta formato: Nombre (categoría)(P) donde P indica pagado
   * Ejemplo: Juan (2P) - Categoría 2, pagado
   */
  addBulkParticipants() {
    const newParticipants = this.participantService.parseBulkParticipants(
      this.bulkParticipantNames,
      this.participants
    );

    this.participants.push(...newParticipants);
    this.bulkParticipantNames = '';
  }

  // Métodos para generar grupos
  
  /**
   * Verifica si es posible generar grupos
   * @returns true si hay participantes disponibles
   */
  canGenerateGroups(): boolean {
    return this.participants.length > 0;
  }

  /**
   * Genera los grupos de forma aleatoria
   * Mezcla los participantes y los distribuye según el tipo de distribución seleccionado
   * Inicializa los partidos y clasificaciones para cada grupo
   */
  generateGroups() {
    if (!this.canGenerateGroups()) {
      alert('No hay participantes para generar grupos.');
      return;
    }

    // Mezclar participantes aleatoriamente
    const shuffledParticipants = this.participantService.shuffleParticipants(this.participants);

    // Generar grupos
    this.generatedGroups = this.groupGeneratorService.generateGroups(
      shuffledParticipants,
      this.distributionType,
      this.numberOfGroups,
      this.minParticipantsPerGroup
    );

    // Inicializar partidos y clasificaciones
    const result = this.matchManagementService.initializeMatchesAndStandings(this.generatedGroups);
    this.groupMatches = result.matches;
    this.groupStandings = result.standings;

    this.showGroups = true;
  }

  // Métodos para partidos y clasificación
  
  /**
   * Obtiene todos los partidos de un grupo específico
   * @param groupId - ID del grupo
   * @returns Array de partidos del grupo
   */
  getGroupMatches(groupId: number): Match[] {
    return this.groupMatches.get(groupId) || [];
  }

  /**
   * Obtiene la clasificación de un grupo específico
   * @param groupId - ID del grupo
   * @returns Array de clasificación ordenado por victorias y diferencia de goles
   */
  getGroupStandings(groupId: number): GroupStanding[] {
    return this.groupStandings.get(groupId) || [];
  }

  /**
   * Busca un participante por su ID
   * @param participantId - ID del participante
   * @returns Participante encontrado o undefined
   */
  getParticipantById(participantId: number): Participant | undefined {
    return this.participants.find(p => p.id === participantId);
  }

  /**
   * Obtiene las estadísticas de un participante en un grupo específico
   * @param groupId - ID del grupo
   * @param participantId - ID del participante
   * @returns Estadísticas del participante o undefined
   */
  getStandingForParticipant(groupId: number, participantId: number): GroupStanding | undefined {
    const standings = this.getGroupStandings(groupId);
    return standings.find(s => s.participantId === participantId);
  }

  /**
   * Maneja el cambio de ganador en un partido
   * Si se selecciona el mismo ganador, lo deselecciona
   * Actualiza automáticamente la clasificación del grupo
   * @param groupId - ID del grupo
   * @param match - Partido a actualizar
   * @param winner - Número del ganador (1 o 2)
   */
  onMatchWinnerChange(groupId: number, match: Match, winner: number) {
    if (match.winner === winner) {
      match.winner = null;
    } else {
      match.winner = winner;
    }
    const matches = this.getGroupMatches(groupId);
    const standings = this.getGroupStandings(groupId);
    const updatedStandings = this.matchManagementService.updateStandings(matches, standings);
    this.groupStandings.set(groupId, updatedStandings);
  }

  /**
   * Maneja el cambio de marcador en un partido
   * Actualiza automáticamente la clasificación del grupo
   * @param groupId - ID del grupo
   * @param match - Partido con marcador actualizado
   */
  onMatchScoreChange(groupId: number, match: Match) {
    const matches = this.getGroupMatches(groupId);
    const standings = this.getGroupStandings(groupId);
    const updatedStandings = this.matchManagementService.updateStandings(matches, standings);
    this.groupStandings.set(groupId, updatedStandings);
  }

  /**
   * Exporta un PDF resumen con todos los grupos en formato horizontal
   * Muestra grupos en columnas con sus participantes y categorías
   * Descarga automáticamente el archivo PDF
   */
  exportToPDF() {
    this.pdfExportService.exportSummaryPDF(
      this.generatedGroups,
      this.tournamentName,
      (categoryId) => this.getCategoryName(categoryId)
    );
  }

  /**
   * Asigna letras aleatorias a los grupos generados
   * Genera letras (A, B, C, etc.) y las mezcla aleatoriamente
   * Renombra cada grupo con su letra correspondiente
   */
  assignRandomLetters() {
    this.groupGeneratorService.assignRandomLetters(this.generatedGroups);
  }

  /**
   * Exporta un PDF detallado con una página por grupo
   * Incluye espacio para registrar victorias, diferencia de goles y clasificación
   * Muestra todos los enfrentamientos del grupo con líneas para anotar resultados
   * Descarga automáticamente el archivo PDF
   */
  exportDetailedPDF() {
    this.pdfExportService.exportDetailedPDF(
      this.generatedGroups,
      this.tournamentName
    );
  }
}

