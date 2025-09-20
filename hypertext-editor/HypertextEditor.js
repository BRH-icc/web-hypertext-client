import React, { useEffect, useRef, useState } from 'react';
import { EditorState, Plugin } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { Schema, DOMParser } from 'prosemirror-model';
import { schema } from 'prosemirror-schema-basic';
import { addListNodes } from 'prosemirror-schema-list';
import { exampleSetup } from 'prosemirror-example-setup';
import { collab, sendableSteps, getVersion } from 'prosemirror-collab';
import './HypertextEditor.css';

// Extend the basic schema with list nodes and hypertext features
const hypertextSchema = new Schema({
  nodes: addListNodes(schema.spec.nodes, 'paragraph block*', 'block').append({
    hyperlink: {
      attrs: { href: {}, title: { default: null } },
      group: 'inline',
      inline: true,
      content: 'text*',
      parseDOM: [{ tag: 'a[href]', getAttrs(dom) {
        return { href: dom.getAttribute('href'), title: dom.getAttribute('title') };
      }}],
      toDOM(node) {
        return ['a', node.attrs, 0];
      }
    },
    annotation: {
      attrs: { id: {}, author: {}, timestamp: { default: null } },
      group: 'inline',
      inline: true,
      content: 'text*',
      parseDOM: [{ tag: 'span.annotation', getAttrs(dom) {
        return {
          id: dom.getAttribute('data-id'),
          author: dom.getAttribute('data-author'),
          timestamp: dom.getAttribute('data-timestamp')
        };
      }}],
      toDOM(node) {
        return ['span', {
          class: 'annotation',
          'data-id': node.attrs.id,
          'data-author': node.attrs.author,
          'data-timestamp': node.attrs.timestamp
        }, 0];
      }
    }
  }),
  marks: schema.spec.marks.append({
    comment: {
      attrs: { id: {}, comment: {} },
      parseDOM: [{ tag: 'span.comment', getAttrs(dom) {
        return {
          id: dom.getAttribute('data-id'),
          comment: dom.getAttribute('data-comment')
        };
      }}],
      toDOM(node) {
        return ['span', {
          class: 'comment',
          'data-id': node.attrs.id,
          'data-comment': node.attrs.comment,
          title: node.attrs.comment
        }, 0];
      }
    }
  })
});

const HypertextEditor = ({ 
  document, 
  onChange, 
  isCollaborative, 
  onCollaborationToggle 
}) => {
  const editorRef = useRef(null);
  const [editorView, setEditorView] = useState(null);
  const [collaborators, setCollaborators] = useState([]);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [showAnnotationPanel, setShowAnnotationPanel] = useState(false);
  const [annotations, setAnnotations] = useState([]);
  const [currentSelection, setCurrentSelection] = useState(null);

  useEffect(() => {
    if (!editorRef.current) return;

    // Create plugins array
    const plugins = [
      ...exampleSetup({ schema: hypertextSchema, menuBar: false }),
    ];

    // Add collaboration plugin if enabled
    if (isCollaborative) {
      plugins.push(collab({ version: 0 }));
    }

    // Create editor state
    const state = EditorState.create({
      doc: document?.content 
        ? DOMParser.fromSchema(hypertextSchema).parse(
            new DOMParser().parseFromString(document.content, 'text/html').body
          )
        : hypertextSchema.nodes.doc.createAndFill(),
      plugins
    });

    // Create editor view
    const view = new EditorView(editorRef.current, {
      state,
      dispatchTransaction(transaction) {
        const newState = view.state.apply(transaction);
        view.updateState(newState);

        // Notify parent of changes
        if (transaction.docChanged && onChange) {
          const content = view.dom.innerHTML;
          onChange(content);
        }

        // Handle collaborative updates
        if (isCollaborative && transaction.docChanged) {
          handleCollaborativeUpdate(view, transaction);
        }

        // Update selection for annotations
        setCurrentSelection(newState.selection);
      }
    });

    setEditorView(view);

    return () => {
      view.destroy();
    };
  }, [document, isCollaborative]);

  const handleCollaborativeUpdate = (view, transaction) => {
    // Send changes to collaboration server
    const sendable = sendableSteps(view.state);
    if (sendable && window.hypertextAPI) {
      window.hypertextAPI.sendCollaborativeUpdate({
        version: sendable.version,
        steps: sendable.steps,
        clientID: sendable.clientID
      });
    }
  };

  useEffect(() => {
    // Set up collaborative event listeners
    if (window.hypertextAPI && isCollaborative) {
      const handleCollabUpdate = (event, update) => {
        if (editorView) {
          // Apply remote changes
          const { steps, version } = update;
          const newState = editorView.state.applySteps(steps, version);
          editorView.updateState(newState);
        }
      };

      window.hypertextAPI.onCollaborativeUpdate(handleCollabUpdate);

      return () => {
        window.electronAPI.removeAllListeners('hypertext-collab-update');
      };
    }
  }, [editorView, isCollaborative]);

  const insertHyperlink = (href, title = '') => {
    if (!editorView || !currentSelection) return;

    const { from, to } = currentSelection;
    const node = hypertextSchema.nodes.hyperlink.create(
      { href, title },
      hypertextSchema.text(href)
    );

    const tr = editorView.state.tr.replaceWith(from, to, node);
    editorView.dispatch(tr);
    setShowLinkDialog(false);
  };

  const addAnnotation = (text, comment) => {
    if (!editorView || !currentSelection) return;

    const annotation = {
      id: Date.now().toString(),
      author: 'Current User', // TODO: Get from user context
      timestamp: new Date().toISOString(),
      comment,
      position: currentSelection.from
    };

    const node = hypertextSchema.nodes.annotation.create(
      {
        id: annotation.id,
        author: annotation.author,
        timestamp: annotation.timestamp
      },
      hypertextSchema.text(text)
    );

    const tr = editorView.state.tr.replaceSelectionWith(node);
    editorView.dispatch(tr);

    setAnnotations([...annotations, annotation]);
    setShowAnnotationPanel(false);
  };

  const toggleCollaboration = async () => {
    try {
      if (isCollaborative) {
        await window.hypertextAPI.disconnectFromCollaboration();
        setCollaborators([]);
      } else {
        const sessionId = prompt('Enter collaboration session ID:');
        if (sessionId) {
          await window.hypertextAPI.connectToCollaboration(sessionId);
        }
      }
      onCollaborationToggle(!isCollaborative);
    } catch (error) {
      console.error('Collaboration toggle failed:', error);
    }
  };

  return (
    <div className=\"hypertext-editor\">
      <div className=\"editor-toolbar\">
        <div className=\"toolbar-group\">
          <button 
            className=\"toolbar-btn\"
            onClick={() => setShowLinkDialog(true)}
            title=\"Insert Hyperlink\"
          >
            🔗
          </button>
          <button 
            className=\"toolbar-btn\"
            onClick={() => setShowAnnotationPanel(true)}
            title=\"Add Annotation\"
          >
            📝
          </button>
          <button 
            className={`toolbar-btn ${isCollaborative ? 'active' : ''}`}
            onClick={toggleCollaboration}
            title=\"Toggle Collaboration\"
          >
            👥
          </button>
        </div>
        
        {isCollaborative && (
          <div className=\"collaborators\">
            <span className=\"collab-label\">Collaborators:</span>
            {collaborators.map(collab => (
              <span key={collab.id} className=\"collaborator\" style={{ backgroundColor: collab.color }}>
                {collab.name}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className=\"editor-content\">
        <div ref={editorRef} className=\"prosemirror-editor\" />
        
        {showAnnotationPanel && (
          <div className=\"annotation-panel\">
            <h3>Annotations</h3>
            <div className=\"annotations-list\">
              {annotations.map(annotation => (
                <div key={annotation.id} className=\"annotation-item\">
                  <div className=\"annotation-meta\">
                    <strong>{annotation.author}</strong>
                    <span className=\"timestamp\">
                      {new Date(annotation.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <div className=\"annotation-content\">{annotation.comment}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showLinkDialog && (
        <div className=\"modal-overlay\">
          <div className=\"link-dialog\">
            <h3>Insert Hyperlink</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              insertHyperlink(formData.get('href'), formData.get('title'));
            }}>
              <div className=\"form-group\">
                <label htmlFor=\"href\">URL:</label>
                <input 
                  type=\"url\" 
                  id=\"href\" 
                  name=\"href\" 
                  required 
                  placeholder=\"https://example.com\"
                />
              </div>
              <div className=\"form-group\">
                <label htmlFor=\"title\">Title (optional):</label>
                <input 
                  type=\"text\" 
                  id=\"title\" 
                  name=\"title\" 
                  placeholder=\"Link title\"
                />
              </div>
              <div className=\"dialog-buttons\">
                <button type=\"button\" onClick={() => setShowLinkDialog(false)}>
                  Cancel
                </button>
                <button type=\"submit\">Insert Link</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HypertextEditor;