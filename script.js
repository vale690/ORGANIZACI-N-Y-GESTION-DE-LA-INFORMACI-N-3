document.addEventListener('DOMContentLoaded', () => {
    const documentForm = document.getElementById('document-form');
    const nombreDocumentoInput = document.getElementById('nombreDocumento');
    const categoriaInput = document.getElementById('categoria');
    const etiquetasInput = document.getElementById('etiquetas');
    const fechaInput = document.getElementById('fecha');
    const descripcionTextarea = document.getElementById('descripcion');
    const documentTableBody = document.querySelector('#document-table tbody');
    const clearButton = document.querySelector('.clear-btn');
    const exportButton = document.querySelector('.export-btn');
    const importButton = document.querySelector('.import-btn');
    const importFile = document.getElementById('importFile');

    let documents = JSON.parse(localStorage.getItem('documents')) || [];
    let editingIndex = -1; // Para saber si estamos editando o agregando un nuevo documento

    // Gráfico de reporte por categoría
    const ctx = document.getElementById('categoryChart').getContext('2d');
    let categoryChart;

    function renderDocuments() {
        documentTableBody.innerHTML = ''; // Limpiar tabla antes de renderizar
        documents.forEach((doc, index) => {
            const row = documentTableBody.insertRow();
            row.insertCell().textContent = doc.nombreDocumento;
            row.insertCell().textContent = doc.categoria;
            row.insertCell().textContent = doc.etiquetas;
            row.insertCell().textContent = doc.fecha;
            row.insertCell().textContent = doc.descripcion;

            const actionsCell = row.insertCell();
            actionsCell.classList.add('action-buttons');

            const editButton = document.createElement('button');
            editButton.classList.add('edit-icon'); // Clase para el emoji de lápiz
            editButton.title = 'Editar';
            editButton.onclick = () => editDocument(index);
            actionsCell.appendChild(editButton);

            const deleteButton = document.createElement('button');
            deleteButton.classList.add('delete-icon'); // Clase para el emoji de papelera
            deleteButton.title = 'Eliminar';
            deleteButton.onclick = () => deleteDocument(index);
            actionsCell.appendChild(deleteButton);
        });
        updateChart();
    }

    function saveDocuments() {
        localStorage.setItem('documents', JSON.stringify(documents));
    }

    function clearForm() {
        nombreDocumentoInput.value = '';
        categoriaInput.value = '';
        etiquetasInput.value = '';
        fechaInput.value = '';
        descripcionTextarea.value = '';
        editingIndex = -1; // Resetear el índice de edición
        documentForm.querySelector('button[type="submit"]').textContent = 'Guardar';
    }

    function addOrUpdateDocument(event) {
        event.preventDefault();

        const newDocument = {
            nombreDocumento: nombreDocumentoInput.value,
            categoria: categoriaInput.value,
            etiquetas: etiquetasInput.value,
            fecha: fechaInput.value,
            descripcion: descripcionTextarea.value,
        };

        if (editingIndex > -1) {
            // Actualizar documento existente
            documents[editingIndex] = newDocument;
        } else {
            // Agregar nuevo documento
            documents.push(newDocument);
        }

        saveDocuments();
        renderDocuments();
        clearForm();
    }

    function editDocument(index) {
        const docToEdit = documents[index];
        nombreDocumentoInput.value = docToEdit.nombreDocumento;
        categoriaInput.value = docToEdit.categoria;
        etiquetasInput.value = docToEdit.etiquetas;
        fechaInput.value = docToEdit.fecha;
        descripcionTextarea.value = docToEdit.descripcion;
        editingIndex = index;
        documentForm.querySelector('button[type="submit"]').textContent = 'Actualizar';
    }

    function deleteDocument(index) {
        if (confirm('¿Estás seguro de que quieres eliminar este documento?')) {
            documents.splice(index, 1);
            saveDocuments();
            renderDocuments();
            clearForm(); // Asegurarse de limpiar el formulario si se elimina el documento que se estaba editando
        }
    }

    function exportDocuments() {
        const dataStr = JSON.stringify(documents, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'documentos_gestion.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function importDocuments(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedDocs = JSON.parse(e.target.result);
                if (Array.isArray(importedDocs)) {
                    documents = documents.concat(importedDocs); // Añadir los documentos importados a los existentes
                    saveDocuments();
                    renderDocuments();
                    alert('Documentos importados exitosamente.');
                } else {
                    alert('El archivo JSON no contiene un array de documentos válido.');
                }
            } catch (error) {
                alert('Error al leer el archivo JSON: ' + error.message);
            }
        };
        reader.readAsText(file);
    }

    function updateChart() {
        const categoryCounts = {};
        documents.forEach(doc => {
            const category = doc.categoria || 'Sin Categoría';
            categoryCounts[category] = (categoryCounts[category] || 0) + 1;
        });

        const labels = Object.keys(categoryCounts);
        const data = Object.values(categoryCounts);
        const backgroundColors = generateColors(labels.length);

        if (categoryChart) {
            categoryChart.destroy(); // Destruir el gráfico anterior si existe
        }

        categoryChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: backgroundColors,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            color: '#f0f0f0' // Color de las etiquetas de la leyenda
                        }
                    },
                    title: {
                        display: true,
                        text: 'Distribución de Documentos por Categoría',
                        color: '#4a90e2' // Color del título del gráfico
                    }
                }
            }
        });
    }

    function generateColors(numColors) {
        const colors = [];
        for (let i = 0; i < numColors; i++) {
            // Genera colores HSL para variedad y brillo
            const hue = (i * 137) % 360; // 137 es un número primo para distribuir bien los colores
            colors.push(hsl(${hue}, 70%, 60%));
        }
        return colors;
    }


    // Event Listeners
    documentForm.addEventListener('submit', addOrUpdateDocument);
    clearButton.addEventListener('click', clearForm);
    exportButton.addEventListener('click', exportDocuments);
    importButton.addEventListener('click', () => importFile.click());
    importFile.addEventListener('change', importDocuments);

    // Initial render
    renderDocuments();
});
