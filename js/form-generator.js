// Form generator utilities
class FormGenerator {
    static createFormField(field) {
        const formGroup = document.createElement('div');
        formGroup.className = 'form-group';

        const label = document.createElement('label');
        label.className = 'form-label';
        label.textContent = field.label;
        if (field.required) {
            label.textContent += ' *';
        }
        formGroup.appendChild(label);

        let input;
        switch (field.type) {
            case 'select':
                input = document.createElement('select');
                input.className = 'form-input';
                field.options.forEach(option => {
                    const opt = document.createElement('option');
                    opt.value = option.value;
                    opt.textContent = option.label;
                    input.appendChild(opt);
                });
                break;

            case 'textarea':
                input = document.createElement('textarea');
                input.className = 'form-input';
                input.rows = field.rows || 3;
                break;

            case 'checkbox-group':
                const checkboxContainer = document.createElement('div');
                checkboxContainer.className = 'profile-grid';
                field.options.forEach(option => {
                    const checkboxWrapper = document.createElement('label');
                    checkboxWrapper.className = 'checkbox-label';
                    
                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.id = option.id;
                    
                    checkboxWrapper.appendChild(checkbox);
                    checkboxWrapper.appendChild(document.createTextNode(` ${option.label}`));
                    checkboxContainer.appendChild(checkboxWrapper);
                });
                formGroup.appendChild(checkboxContainer);
                return formGroup;

            default:
                input = document.createElement('input');
                input.className = 'form-input';
                input.type = field.type;
        }

        if (input) {
            input.id = field.id;
            formGroup.appendChild(input);
        }

        return formGroup;
    }

    static createFormSection(sectionId, section) {
        const sectionElement = document.createElement('div');
        sectionElement.id = `${sectionId}Section`;
        sectionElement.className = 'form-section';

        const title = document.createElement('h2');
        title.className = 'section-title';
        title.textContent = section.title;
        sectionElement.appendChild(title);

        // Handle list type sections
        if (section.type === 'list') {
            const listContainer = document.createElement('div');
            listContainer.className = 'form-list';
            listContainer.id = `${sectionId}List`;

            // Add button for new items
            const addButton = document.createElement('button');
            addButton.type = 'button';
            addButton.className = 'add-list-item-btn';
            addButton.textContent = section.addButtonText || '新增項目';
            addButton.onclick = () => this.addListItem(sectionId, section.itemFields);

            sectionElement.appendChild(listContainer);
            sectionElement.appendChild(addButton);

            return sectionElement;
        }

        const fieldsContainer = document.createElement('div');
        fieldsContainer.className = 'form-fields';

        // Handle subsections if they exist
        if (section.subsections) {
            Object.entries(section.subsections).forEach(([subsectionId, subsection], index) => {
                // Add divider before subsection (except for the first one)
                if (index > 0) {
                    const divider = document.createElement('hr');
                    divider.className = 'subsection-divider';
                    fieldsContainer.appendChild(divider);
                }

                // Add subsection title
                const subsectionTitle = document.createElement('h3');
                subsectionTitle.className = 'subsection-title';
                subsectionTitle.textContent = subsection.title;
                fieldsContainer.appendChild(subsectionTitle);

                // Create subsection fields
                subsection.fields.forEach(field => {
                    fieldsContainer.appendChild(this.createFormField(field));
                });
            });
        }

        // Handle regular fields if they exist
        if (section.fields) {
            // Add divider if we had subsections and now have regular fields
            if (section.subsections && section.fields.length > 0) {
                const divider = document.createElement('hr');
                divider.className = 'subsection-divider';
                fieldsContainer.appendChild(divider);
            }

            section.fields.forEach(field => {
                fieldsContainer.appendChild(this.createFormField(field));
            });
        }

        sectionElement.appendChild(fieldsContainer);
        return sectionElement;
    }

    static addListItem(sectionId, fields) {
        const listContainer = document.getElementById(`${sectionId}List`);
        const itemId = Date.now(); // Use timestamp as unique ID
        
        const item = document.createElement('div');
        item.className = 'form-list-item';
        item.dataset.itemId = itemId;

        // Add delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.className = 'delete-btn';
        deleteBtn.innerHTML = '×';
        deleteBtn.onclick = () => item.remove();
        item.appendChild(deleteBtn);

        // Create fields for this item
        fields.forEach(field => {
            const fieldCopy = { ...field };
            fieldCopy.id = `${field.id}_${itemId}`; // Make field IDs unique
            item.appendChild(this.createFormField(fieldCopy));
        });

        listContainer.appendChild(item);
    }

    static generateForm(containerId) {
        const container = document.getElementById(containerId);
        container.innerHTML = '';

        Object.entries(formConfig.sections).forEach(([sectionId, section]) => {
            container.appendChild(this.createFormSection(sectionId, section));
        });
    }

    static loadData(data) {
        Object.entries(formConfig.sections).forEach(([sectionId, section]) => {
            if (section.type === 'list') {
                // Handle list type sections
                const listContainer = document.getElementById(`${sectionId}List`);
                if (listContainer) {
                    listContainer.innerHTML = ''; // Clear existing items
                    if (Array.isArray(data[sectionId])) {
                        data[sectionId].forEach(itemData => {
                            const itemId = Date.now() + Math.random(); // Generate unique ID
                            const item = document.createElement('div');
                            item.className = 'form-list-item';
                            item.dataset.itemId = itemId;

                            // Add delete button
                            const deleteBtn = document.createElement('button');
                            deleteBtn.type = 'button';
                            deleteBtn.className = 'delete-btn';
                            deleteBtn.innerHTML = '×';
                            deleteBtn.onclick = () => item.remove();
                            item.appendChild(deleteBtn);

                            // Create and populate fields
                            section.itemFields.forEach(field => {
                                const fieldCopy = { ...field };
                                fieldCopy.id = `${field.id}_${itemId}`;
                                const fieldElement = this.createFormField(fieldCopy);
                                item.appendChild(fieldElement);

                                // Set field value
                                const input = fieldElement.querySelector('input, textarea, select');
                                if (input) {
                                    if (field.type === 'checkbox') {
                                        input.checked = itemData[field.id] || false;
                                    } else {
                                        input.value = itemData[field.id] || '';
                                    }
                                }
                            });

                            listContainer.appendChild(item);
                        });
                    }
                }
                return;
            }

            // Handle subsections if they exist
            if (section.subsections) {
                Object.values(section.subsections).forEach(subsection => {
                    subsection.fields.forEach(field => {
                        const element = document.getElementById(field.id);
                        if (element) {
                            if (field.type === 'checkbox') {
                                element.checked = data[field.id] || false;
                            } else {
                                element.value = data[field.id] || '';
                            }
                        }
                    });
                });
            }

            // Handle regular fields
            if (section.fields) {
                section.fields.forEach(field => {
                    if (field.type === 'checkbox-group') {
                        field.options.forEach(option => {
                            const checkbox = document.getElementById(option.id);
                            if (checkbox) {
                                checkbox.checked = data[option.id] || false;
                            }
                        });
                    } else {
                        const element = document.getElementById(field.id);
                        if (element) {
                            if (field.type === 'checkbox') {
                                element.checked = data[field.id] || false;
                            } else {
                                element.value = data[field.id] || '';
                            }
                        }
                    }
                });
            }
        });
    }

    static getFormData() {
        const data = {};
        
        Object.entries(formConfig.sections).forEach(([sectionId, section]) => {
            if (section.type === 'list') {
                // Handle list type sections
                const listContainer = document.getElementById(`${sectionId}List`);
                if (listContainer) {
                    const items = [];
                    listContainer.querySelectorAll('.form-list-item').forEach(item => {
                        const itemData = {};
                        const itemId = item.dataset.itemId;
                        section.itemFields.forEach(field => {
                            const element = document.getElementById(`${field.id}_${itemId}`);
                            if (element) {
                                if (field.type === 'checkbox') {
                                    itemData[field.id] = element.checked;
                                } else {
                                    itemData[field.id] = element.value;
                                }
                            }
                        });
                        items.push(itemData);
                    });
                    data[sectionId] = items;
                }
                return;
            }

            // Handle subsections if they exist
            if (section.subsections) {
                Object.values(section.subsections).forEach(subsection => {
                    subsection.fields.forEach(field => {
                        const element = document.getElementById(field.id);
                        if (element) {
                            if (field.type === 'checkbox') {
                                data[field.id] = element.checked;
                            } else {
                                data[field.id] = element.value;
                            }
                        }
                    });
                });
            }

            // Handle regular fields
            if (section.fields) {
                section.fields.forEach(field => {
                    if (field.type === 'checkbox-group') {
                        field.options.forEach(option => {
                            const checkbox = document.getElementById(option.id);
                            if (checkbox) {
                                data[option.id] = checkbox.checked;
                            }
                        });
                    } else {
                        const element = document.getElementById(field.id);
                        if (element) {
                            if (field.type === 'checkbox') {
                                data[field.id] = element.checked;
                            } else {
                                data[field.id] = element.value;
                            }
                        }
                    }
                });
            }
        });

        return data;
    }

    static validateForm() {
        const errors = [];
        
        Object.entries(formConfig.sections).forEach(([sectionId, section]) => {
            if (section.type === 'list') {
                // Handle list type sections
                const listContainer = document.getElementById(`${sectionId}List`);
                if (listContainer) {
                    listContainer.querySelectorAll('.form-list-item').forEach((item, index) => {
                        const itemId = item.dataset.itemId;
                        section.itemFields.forEach(field => {
                            if (field.required) {
                                const element = document.getElementById(`${field.id}_${itemId}`);
                                if (!element || !element.value.trim()) {
                                    errors.push(`第 ${index + 1} 個${section.title}的 ${field.label}為必填欄位`);
                                }
                            }
                        });
                    });
                }
                return;
            }

            // Handle subsections if they exist
            if (section.subsections) {
                Object.values(section.subsections).forEach(subsection => {
                    subsection.fields.forEach(field => {
                        if (field.required) {
                            const element = document.getElementById(field.id);
                            if (!element || !element.value.trim()) {
                                errors.push(`${field.label}為必填欄位`);
                            }
                        }
                    });
                });
            }

            // Handle regular fields
            if (section.fields) {
                section.fields.forEach(field => {
                    if (field.required) {
                        if (field.type === 'checkbox-group') {
                            const hasChecked = field.options.some(option => {
                                const checkbox = document.getElementById(option.id);
                                return checkbox && checkbox.checked;
                            });
                            if (!hasChecked) {
                                errors.push(`${field.label}為必填欄位`);
                            }
                        } else {
                            const element = document.getElementById(field.id);
                            if (!element || !element.value.trim()) {
                                errors.push(`${field.label}為必填欄位`);
                            }
                        }
                    }
                });
            }
        });

        return errors;
    }
}

// Export the form generator
window.FormGenerator = FormGenerator; 