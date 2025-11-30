import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import { Group, Participant, Category } from '../models/tournament.models';

@Injectable({
  providedIn: 'root'
})
export class PdfExportService {

  /**
   * Exporta un PDF resumen con todos los grupos en formato horizontal
   * Muestra grupos en columnas con sus participantes y categorías
   * Descarga automáticamente el archivo PDF
   */
  exportSummaryPDF(
    groups: Group[], 
    tournamentName: string, 
    getCategoryName: (categoryId: number) => string
  ): void {
    const doc = new jsPDF({ orientation: 'landscape' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    let yPosition = margin;

    // Título del documento
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    const title = tournamentName || 'Grupos del Torneo';
    doc.text(title, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;

    // Calcular cuántos grupos caben por fila
    const groupsPerRow = groups.length <= 2 ? groups.length : 3;
    const columnWidth = (pageWidth - 2 * margin) / groupsPerRow;
    const groupSpacing = 10;

    let currentColumn = 0;
    let maxYInRow = yPosition;

    groups.forEach((group, index) => {
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
        const categoryName = getCategoryName(participant.categoryId);
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
    const fileName = tournamentName 
      ? `${tournamentName.replace(/\s+/g, '_')}_grupos.pdf` 
      : 'grupos_torneo.pdf';
    doc.save(fileName);
  }

  /**
   * Exporta un PDF detallado con una página por grupo
   * Incluye espacio para registrar victorias, diferencia de goles y clasificación
   * Muestra todos los enfrentamientos del grupo con líneas para anotar resultados
   * Descarga automáticamente el archivo PDF
   */
  exportDetailedPDF(groups: Group[], tournamentName: string): void {
    const doc = new jsPDF({ orientation: 'portrait' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;

    groups.forEach((group, groupIndex) => {
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
    const fileName = tournamentName 
      ? `${tournamentName.replace(/\s+/g, '_')}_detallado.pdf` 
      : 'grupos_detallado.pdf';
    doc.save(fileName);
  }
}
