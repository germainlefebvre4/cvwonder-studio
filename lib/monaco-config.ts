import { editor } from 'monaco-editor';

// Function to configure Monaco editor with the CVWonder schema
export const configureMonacoYamlEditor = async (monaco: any) => {
  try {
    // Fetch the schema from the local file
    const schema = await import('../schemas/3.0.0/cvwonder.json');
    
    // Check if the YAML language is already registered
    if (!monaco.languages.getLanguages().some((lang: any) => lang.id === 'yaml')) {
      console.log('YAML language not registered, registering simple YAML support');
      
      // Register a basic YAML language if full support is not available
      monaco.languages.register({ id: 'yaml' });
    }
    
    // Register basic completion provider for YAML
    monaco.languages.registerCompletionItemProvider('yaml', {
      provideCompletionItems: (model: editor.ITextModel, position: editor.IPosition) => {
        // Get the text before the cursor
        const textUntilPosition = model.getValueInRange({
          startLineNumber: 1,
          startColumn: 1,
          endLineNumber: position.lineNumber,
          endColumn: position.column
        });
        
        // Create suggestions based on the schema and current position
        const lines = textUntilPosition.split('\n');
        const currentLine = lines[position.lineNumber - 1];
        const indentationLevel = currentLine.match(/^\s*/)?.[0].length || 0;

        // Determine the current context (entity/subentity) based on indentation
        let contextKey = '';
        for (let i = position.lineNumber - 2; i >= 0; i--) {
          const line = lines[i];
          const lineIndentation = line.match(/^\s*/)?.[0].length || 0;

          if (lineIndentation < indentationLevel && line.trim().endsWith(':')) {
            contextKey = line.trim().replace(/:$/, '');
            break;
          }
        }

        const contextStack: string[] = contextKey ? [contextKey] : [];

        // Build the current context path
        const contextPath = contextStack.join('.');

        console.log("textUntilPosition", textUntilPosition);
        console.log("position", position);
        console.log("contextPath", contextPath);

        // Create suggestions based on the schema and context
        const suggestions = createCompletionItemsFromSchema(schema, contextPath, monaco);
        
        return {
          suggestions
        };
      }
    });
    
    console.log('Monaco editor configured with CVWonder schema');
  } catch (error) {
    console.error('Error configuring Monaco editor:', error);
  }
};

// Helper function to create completion items from schema
function createCompletionItemsFromSchema(schema: any, contextPath: string, monaco: any): editor.CompletionItem[] {
    const suggestions: editor.CompletionItem[] = [];
    
    if (!schema.properties) {
        return suggestions;
    }

    // Navigate the schema based on the contextPath
    const contextParts = contextPath.split('.').filter(Boolean);
    let currentSchema = schema;

    for (const part of contextParts) {
        if (currentSchema.properties && currentSchema.properties[part]) {
            currentSchema = currentSchema.properties[part];
        } else {
            return suggestions; // If the context path is invalid, return no suggestions
        }

        if (currentSchema.type === 'array' && currentSchema.items) {
            currentSchema = currentSchema.items; // Navigate into array items if applicable
        }
    }

    // Generate suggestions for the current schema level
    if (currentSchema.properties) {
        for (const key in currentSchema.properties) {
            suggestions.push({
                label: key,
                kind: monaco.languages.CompletionItemKind.Property,
                insertText: `${key}:`,
                detail: getPropertyDetailFromSchema(currentSchema.properties[key]),
                documentation: {
                    value: getPropertyDocFromSchema(currentSchema.properties[key])
                }
            });

            // Add array items if applicable
            if (currentSchema.properties[key].type === 'array' && currentSchema.properties[key].items) {
                suggestions.push({
                    label: `${key}[]`,
                    kind: monaco.languages.CompletionItemKind.Property,
                    insertText: `${key}:\n  - `,
                    detail: `Array of ${currentSchema.properties[key].items.type || 'items'}`,
                    documentation: {
                        value: getPropertyDocFromSchema(currentSchema.properties[key].items)
                    }
                });
            }
        }
    }

    return suggestions;
}

// Helper function to get property details from schema
function getPropertyDetailFromSchema(property: any): string {
  if (!property) return '';
  
  let detail = property.type || 'any';
  
  if (property.description) {
    detail += ` - ${property.description}`;
  }
  
  return detail;
}

// Helper function to get property documentation from schema
function getPropertyDocFromSchema(property: any): string {
  if (!property) return '';
  
  let doc = '';
  
  if (property.description) {
    doc += property.description + '\n\n';
  }
  
  if (property.type) {
    doc += `Type: ${property.type}\n`;
  }
  
  if (property.example) {
    doc += `Example: ${property.example}\n`;
  }
  
  return doc;
}