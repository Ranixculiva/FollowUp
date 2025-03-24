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

        const fieldsContainer = document.createElement('div');
        fieldsContainer.className = 'form-fields';

        section.fields.forEach(field => {
            fieldsContainer.appendChild(this.createFormField(field));
        });

        sectionElement.appendChild(fieldsContainer);

        // Add followup timeline for the followup section
        if (sectionId === 'followup') {
            const timelineContainer = document.createElement('div');
            timelineContainer.id = 'followupTimeline';
            timelineContainer.className = 'followup-timeline';
            sectionElement.appendChild(timelineContainer);
        }

        return sectionElement;
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
                        element.value = data[field.id] || '';
                    }
                }
            });
        });
    }

    static getFormData() {
        const data = {};
        
        Object.entries(formConfig.sections).forEach(([sectionId, section]) => {
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
                        data[field.id] = element.value;
                    }
                }
            });
        });

        return data;
    }

    static validateForm() {
        const errors = [];
        
        Object.entries(formConfig.sections).forEach(([sectionId, section]) => {
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
        });

        return errors;
    }
}

// Export the form generator
window.FormGenerator = FormGenerator; 