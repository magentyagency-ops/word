import { useState, useCallback } from 'react'
import { solveExercise } from './services/ai'
import {
  Bold, Italic, Underline as UnderlineIcon, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Type, List, ListOrdered, Undo2, Redo2, Search, Save, Printer,
  Home, MoreHorizontal, ChevronDown, ChevronRight, Minus, Plus,
  Clipboard, Scissors, Copy, Mic, Shield, Puzzle, PenTool,
  FileText, Globe, LayoutList, Columns, PanelRight,
  Strikethrough, Subscript, Superscript, Baseline, Highlighter, Paintbrush,
  ArrowDownUp, Pilcrow, IndentDecrease, IndentIncrease, ListCollapse,
  Diamond, TableProperties, Settings, Focus, Pen, Eye
} from 'lucide-react'
import { useEditor, EditorContent } from '@tiptap/react'
import { StarterKit } from '@tiptap/starter-kit'
import { Underline } from '@tiptap/extension-underline'
import { TextAlign } from '@tiptap/extension-text-align'
import { FontFamily } from '@tiptap/extension-font-family'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import { Highlight } from '@tiptap/extension-highlight'
import { FileAttachment } from './extensions/FileAttachment'
import { useRef } from 'react'

function App() {
  const [activeTab, setActiveTab] = useState('Accueil')
  const [zoom, setZoom] = useState(121)
  const [autoSave, setAutoSave] = useState(false)
  const [fontFamily, setFontFamily] = useState('Aptos (Corps)')
  const [fontSize, setFontSize] = useState('12')
  const [fontColor, setFontColor] = useState('#ff0000')
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [isAiThinking, setIsAiThinking] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      FontFamily,
      Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      FileAttachment,
    ],
    content: '',
    editorProps: {
      attributes: {
        spellcheck: 'true',
      },
    },
  })

  const getWordCount = useCallback(() => {
    if (!editor) return 0
    const text = editor.getText()
    if (!text.trim()) return 0
    return text.trim().split(/\s+/).length
  }, [editor])

  const handleItalicClick = async () => {
    if (!editor) return
    
    const { from, to } = editor.state.selection
    const selectedText = editor.state.doc.textBetween(from, to, ' ')

    // Extract file contents from selection
    const attachments = []
    editor.state.doc.nodesBetween(from, to, (node) => {
      if (node.type.name === 'fileAttachment' && node.attrs.fileContent) {
        attachments.push({
          name: node.attrs.fileName,
          content: node.attrs.fileContent
        })
      }
    })

    // If text is selected or attachments exist, trigger AI
    if ((selectedText && selectedText.trim().length > 3) || attachments.length > 0) {
      setIsAiThinking(true)
      setErrorMsg(null)
      try {
        const answer = await solveExercise(selectedText, attachments)
        editor.chain().focus()
          .insertContentAt(to, `\n\n${answer}`)
          .run()
      } catch (err) {
        console.error(err)
        setErrorMsg(err.message)
        setTimeout(() => setErrorMsg(null), 5000)
      } finally {
        setIsAiThinking(false)
      }
    } else {
      // Normal italic behavior
      editor.chain().focus().toggleItalic().run()
    }
  }

  const fileInputRef = useRef(null)

  const handleEditorClick = (event) => {
    const target = event.target
    if (target.classList.contains('file-open-btn')) {
      fileInputRef.current?.click()
    }
  }

  const onFileChange = async (e) => {
    const file = e.target.files[0]
    if (!file || !editor) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target.result
      
      // Update the placeholder node in the editor
      editor.chain().focus()
        .updateAttributes('fileAttachment', {
          fileName: file.name,
          fileContent: content,
          status: 'attached'
        })
        .run()
    }

    if (file.type.startsWith('image/')) {
      reader.readAsDataURL(file) // For images, base64
    } else {
      reader.readAsText(file) // For text/code
    }
    
    // Clear input
    e.target.value = ''
  }

  if (!editor) return null

  const tabs = ['Accueil', 'Insérer', 'Dessin', 'Conception', 'Mise en page', 'Références', 'Publipostage', 'Révision', 'Affichage', 'Acrobat']

  return (
    <div className="word-app">
      {/* ═══════════ TITLE BAR ═══════════ */}
      <div className="title-bar">
        <div className="title-bar-left">
          <span className="auto-save-label">Enregistrement automatique</span>
          <div 
            className={`auto-save-toggle ${autoSave ? 'on' : ''}`}
            onClick={() => setAutoSave(!autoSave)}
          />
          <div className="title-bar-actions">
            <button className="title-bar-btn"><Home size={16} /></button>
            <button className="title-bar-btn"><Save size={16} /></button>
            <button className="title-bar-btn" onClick={() => editor.chain().focus().undo().run()}>
              <Undo2 size={16} />
            </button>
            <button className="title-bar-btn" style={{ display: 'flex', gap: 0 }}>
              <ChevronDown size={8} />
            </button>
            <button className="title-bar-btn" onClick={() => editor.chain().focus().redo().run()}>
              <Redo2 size={16} />
            </button>
            <button className="title-bar-btn"><Printer size={16} /></button>
            <button className="title-bar-btn"><MoreHorizontal size={16} /></button>
          </div>
        </div>
        <div className="title-bar-center">Document1</div>
        <div className="title-bar-right">
          <button className="search-btn">
            <Search size={14} />
            <span>Rechercher (Cmd + Ctrl + U)</span>
          </button>
          <button className="comments-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 4 }}>
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            Commentaires
          </button>
          <button className="modification-btn">
            <Pen size={12} style={{ marginRight: 4 }} />
            Modification
            <ChevronDown size={10} style={{ marginLeft: 4 }} />
          </button>
          <button className="share-btn">
            Partager
            <ChevronDown size={10} />
          </button>
        </div>
      </div>

      {/* ═══════════ TAB BAR ═══════════ */}
      <div className="tab-bar">
        {tabs.map(tab => (
          <div
            key={tab}
            className={`tab-item ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </div>
        ))}
      </div>

      {/* ═══════════ RIBBON ═══════════ */}
      {activeTab === 'Accueil' && (
        <div className="ribbon">
          {/* Coller */}
          <div className="ribbon-group">
            <div className="paste-group">
              <button className="paste-btn" onClick={() => navigator.clipboard.readText().then(text => editor.chain().focus().insertContent(text).run())}>
                <Clipboard size={28} />
                <span>Coller</span>
              </button>
              <div className="paste-sub-btns">
                <button className="paste-sub-btn" onClick={() => {
                  const sel = editor.state.selection
                  const text = editor.state.doc.textBetween(sel.from, sel.to, '')
                  navigator.clipboard.writeText(text)
                  editor.chain().focus().deleteSelection().run()
                }}>
                  <Scissors size={14} />
                </button>
                <button className="paste-sub-btn" onClick={() => {
                  const sel = editor.state.selection
                  const text = editor.state.doc.textBetween(sel.from, sel.to, '')
                  navigator.clipboard.writeText(text)
                }}>
                  <Copy size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Font */}
          <div className="ribbon-group">
            <div className="font-group">
              <div className="font-row">
                <select
                  className="font-select"
                  value={fontFamily}
                  onChange={e => {
                    setFontFamily(e.target.value)
                    editor.chain().focus().setFontFamily(e.target.value).run()
                  }}
                >
                  <option>Aptos (Cor...</option>
                  <option>Arial</option>
                  <option>Calibri</option>
                  <option>Cambria</option>
                  <option>Comic Sans MS</option>
                  <option>Courier New</option>
                  <option>Georgia</option>
                  <option>Segoe UI</option>
                  <option>Times New Roman</option>
                  <option>Verdana</option>
                </select>
                <select
                  className="size-select"
                  value={fontSize}
                  onChange={e => setFontSize(e.target.value)}
                >
                  {[8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48, 72].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <button className="tool-btn"><Type size={14} style={{ transform: 'scaleY(1.1)' }} /></button>
                <button className="tool-btn"><Type size={12} /></button>
                <div className="tool-btn-with-dropdown">
                  <button className="tool-btn">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><text x="4" y="18" fontSize="18" fontWeight="bold" fill="currentColor" stroke="none">Aa</text></svg>
                  </button>
                  <button className="dropdown-arrow"><ChevronDown size={8} /></button>
                </div>
                <button className="tool-btn" onClick={() => editor.chain().focus().toggleHighlight({ color: '#ffff00' }).run()}>
                  <Highlighter size={14} />
                  <span className="color-indicator highlight-color"></span>
                </button>
              </div>
              <div className="font-row">
                <button
                  className={`tool-btn ${editor.isActive('bold') ? 'active' : ''}`}
                  onClick={() => editor.chain().focus().toggleBold().run()}
                  title="Gras (Ctrl+G)"
                >
                  <strong style={{ fontSize: 14, fontWeight: 800 }}>G</strong>
                </button>
                <button
                  className={`tool-btn ${editor.isActive('italic') ? 'active' : ''} ${isAiThinking ? 'loading-pulse' : ''}`}
                  onClick={handleItalicClick}
                  title="Italique / Résoudre avec l'IA"
                  disabled={isAiThinking}
                >
                  <em style={{ fontSize: 14, fontStyle: 'italic', fontFamily: 'serif' }}>I</em>
                </button>
                <div className="tool-btn-with-dropdown">
                  <button
                    className={`tool-btn ${editor.isActive('underline') ? 'active' : ''}`}
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                    title="Souligné (Ctrl+U)"
                  >
                    <span style={{ fontSize: 14, textDecoration: 'underline' }}>S</span>
                  </button>
                  <button className="dropdown-arrow"><ChevronDown size={8} /></button>
                </div>
                <button
                  className={`tool-btn ${editor.isActive('strike') ? 'active' : ''}`}
                  onClick={() => editor.chain().focus().toggleStrike().run()}
                >
                  <span style={{ fontSize: 13, textDecoration: 'line-through' }}>abc</span>
                </button>
                <button className="tool-btn">
                  <span style={{ fontSize: 12 }}>x<sub style={{ fontSize: 8 }}>2</sub></span>
                </button>
                <button className="tool-btn">
                  <span style={{ fontSize: 12 }}>x<sup style={{ fontSize: 8 }}>2</sup></span>
                </button>
                <div className="font-separator" />
                <button className="tool-btn" style={{ position: 'relative' }}>
                  <strong style={{ fontSize: 14 }}>A</strong>
                  <span className="color-indicator" style={{ background: '#2e74b5', bottom: 1 }}></span>
                </button>
                <button className="tool-btn" style={{ position: 'relative' }}>
                  <Paintbrush size={14} />
                </button>
                <div className="tool-btn-with-dropdown" style={{ position: 'relative' }}>
                  <button 
                    className="tool-btn" 
                    title="Couleur de police"
                    onClick={() => editor.chain().focus().setColor(fontColor).run()}
                  >
                    <strong style={{ fontSize: 14 }}>A</strong>
                    <span className="color-indicator" style={{ background: fontColor }}></span>
                  </button>
                  <button 
                    className="dropdown-arrow"
                    onClick={() => setShowColorPicker(!showColorPicker)}
                  >
                    <ChevronDown size={8} />
                  </button>
                  
                  {showColorPicker && (
                    <div className="color-picker-dropdown">
                      <div className="color-grid">
                        {['#000000', '#444444', '#666666', '#999999', '#cccccc', '#eeeeee', '#ffffff', 
                          '#ff0000', '#ffc000', '#ffff00', '#92d050', '#00b050', '#00b0f0', '#0070c0', '#002060', '#7030a0'].map(color => (
                          <div 
                            key={color} 
                            className="color-rect" 
                            style={{ background: color }}
                            onClick={() => {
                              setFontColor(color)
                              editor.chain().focus().setColor(color).run()
                              setShowColorPicker(false)
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Paragraph */}
          <div className="ribbon-group">
            <div className="para-group">
              <div className="para-row">
                <div className="tool-btn-with-dropdown">
                  <button 
                    className={`tool-btn ${editor.isActive('bulletList') ? 'active' : ''}`}
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                  >
                    <List size={15} />
                  </button>
                  <button className="dropdown-arrow"><ChevronDown size={8} /></button>
                </div>
                <div className="tool-btn-with-dropdown">
                  <button 
                    className={`tool-btn ${editor.isActive('orderedList') ? 'active' : ''}`}
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                  >
                    <ListOrdered size={15} />
                  </button>
                  <button className="dropdown-arrow"><ChevronDown size={8} /></button>
                </div>
                <div className="tool-btn-with-dropdown">
                  <button className="tool-btn">
                    <ListCollapse size={15} />
                  </button>
                  <button className="dropdown-arrow"><ChevronDown size={8} /></button>
                </div>
                <button className="tool-btn" onClick={() => editor.chain().focus().liftListItem('listItem').run()}>
                  <IndentDecrease size={15} />
                </button>
                <button className="tool-btn" onClick={() => editor.chain().focus().sinkListItem('listItem').run()}>
                  <IndentIncrease size={15} />
                </button>
                <button className="tool-btn">
                  <ArrowDownUp size={15} />
                </button>
                <button className="tool-btn">
                  <Pilcrow size={15} />
                </button>
              </div>
              <div className="para-row">
                <button
                  className={`tool-btn ${editor.isActive({ textAlign: 'left' }) ? 'active' : ''}`}
                  onClick={() => editor.chain().focus().setTextAlign('left').run()}
                >
                  <AlignLeft size={15} />
                </button>
                <button
                  className={`tool-btn ${editor.isActive({ textAlign: 'center' }) ? 'active' : ''}`}
                  onClick={() => editor.chain().focus().setTextAlign('center').run()}
                >
                  <AlignCenter size={15} />
                </button>
                <button
                  className={`tool-btn ${editor.isActive({ textAlign: 'right' }) ? 'active' : ''}`}
                  onClick={() => editor.chain().focus().setTextAlign('right').run()}
                >
                  <AlignRight size={15} />
                </button>
                <button
                  className={`tool-btn ${editor.isActive({ textAlign: 'justify' }) ? 'active' : ''}`}
                  onClick={() => editor.chain().focus().setTextAlign('justify').run()}
                >
                  <AlignJustify size={15} />
                </button>
                <div className="tool-btn-with-dropdown">
                  <button className="tool-btn">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="3" y1="6" x2="21" y2="6"/>
                      <line x1="3" y1="12" x2="21" y2="12"/>
                      <line x1="3" y1="18" x2="21" y2="18"/>
                      <path d="M18 9l3-3-3-3"/>
                    </svg>
                  </button>
                  <button className="dropdown-arrow"><ChevronDown size={8} /></button>
                </div>
                <div className="tool-btn-with-dropdown">
                  <button className="tool-btn">
                    <Diamond size={14} />
                  </button>
                  <button className="dropdown-arrow"><ChevronDown size={8} /></button>
                </div>
                <button className="tool-btn">
                  <TableProperties size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Styles */}
          <div className="ribbon-group" style={{ padding: '0 8px' }}>
            <div className="styles-group">
              <div className="style-box active">
                <span className="style-box-text">AaBbCcDdE</span>
                <span className="style-box-label">Normal</span>
              </div>
              <div className="style-box">
                <span className="style-box-text">AaBbCcDdE</span>
                <span className="style-box-label">Sans interligne</span>
              </div>
              <button className="style-expand-btn">
                <ChevronRight size={12} />
              </button>
            </div>
          </div>

          {/* Volet Styles */}
          <div className="ribbon-group" style={{ borderRight: 'none' }}>
            <button className="volet-styles-btn">
              <PanelRight size={20} />
              <span>Volet<br/>Styles</span>
            </button>
          </div>

          {/* Dicter */}
          <div className="ribbon-group">
            <div className="large-action-group">
              <button className="large-action-btn">
                <Mic size={22} />
                <span>Dicter</span>
              </button>
            </div>
          </div>

          {/* Sensibilité */}
          <div className="ribbon-group">
            <div className="large-action-group">
              <button className="large-action-btn">
                <Shield size={22} />
                <span>Sensibilité</span>
              </button>
            </div>
          </div>

          {/* Compléments */}
          <div className="ribbon-group">
            <div className="large-action-group">
              <button className="large-action-btn">
                <Puzzle size={22} />
                <span>Compléments</span>
              </button>
            </div>
          </div>

          {/* Rédacteur */}
          <div className="ribbon-group">
            <div className="large-action-group">
              <button className="large-action-btn">
                <PenTool size={22} />
                <span>Rédacteur</span>
              </button>
            </div>
          </div>

          {/* Créer un PDF */}
          <div className="ribbon-group" style={{}}>
            <div className="large-action-group">
              <button className="large-action-btn">
                <FileText size={22} />
                <span style={{ fontSize: 9 }}>Créer un PDF et{'\n'}partager le lien</span>
              </button>
              <button className="large-action-btn">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                  <path d="M15 5l4 4"/>
                </svg>
                <span style={{ fontSize: 9 }}>Demander des{'\n'}signatures</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Insérer' && (
        <div className="ribbon" style={{ justifyContent: 'flex-start' }}>
          <div className="ribbon-group">
            <div className="large-action-group">
              <button className="large-action-btn">
                <Columns size={22} />
                <span>Tableau</span>
              </button>
              <button className="large-action-btn">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                <span>Images</span>
              </button>
            </div>
          </div>
          <div className="ribbon-group">
            <div className="large-action-group">
              <button className="large-action-btn">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                <span>Lien</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty ribbon for other tabs */}
      {!['Accueil', 'Insérer'].includes(activeTab) && (
        <div className="ribbon" style={{ minHeight: 80, justifyContent: 'center', alignItems: 'center' }}>
          <span style={{ color: '#999', fontSize: 12 }}>Onglet {activeTab}</span>
        </div>
      )}

      {/* ═══════════ EDITOR AREA ═══════════ */}
      <div className="editor-area" onClick={handleEditorClick}>
        <div className="page">
          <EditorContent editor={editor} />
        </div>
      </div>

      <input 
        type="file" 
        ref={fileInputRef} 
        style={{ display: 'none' }} 
        onChange={onFileChange}
      />

      {/* ═══════════ STATUS BAR ═══════════ */}
      <div className="status-bar">
        <div className="status-bar-left">
          {isAiThinking ? (
            <span className="ai-loading-text">✨ L'IA réfléchit à votre exercice...</span>
          ) : errorMsg ? (
            <span style={{ color: '#d93025' }}>⚠️ {errorMsg}</span>
          ) : (
            <>
              <span>Page 1 sur 1</span>
              <span>{getWordCount()} mots</span>
              <span>Anglais (États-Unis)</span>
            </>
          )}
          <div className="status-accessibility">
            <Settings size={14} />
            <span>Accessibilité : vérification terminée</span>
          </div>
        </div>
        <div className="status-bar-right">
          <button className="status-icon-btn">
            <Focus size={13} />
          </button>
          <span style={{ fontSize: 11 }}>Focus</span>
          <button className="status-icon-btn active">
            <FileText size={13} />
          </button>
          <button className="status-icon-btn">
            <Globe size={13} />
          </button>
          <button className="status-icon-btn">
            <LayoutList size={13} />
          </button>
          <button className="status-icon-btn">
            <Eye size={13} />
          </button>
          <div className="zoom-controls">
            <button className="status-icon-btn" onClick={() => setZoom(Math.max(10, zoom - 10))}>
              <Minus size={12} />
            </button>
            <input
              type="range"
              className="zoom-slider"
              min="10"
              max="500"
              value={zoom}
              onChange={e => setZoom(parseInt(e.target.value))}
            />
            <button className="status-icon-btn" onClick={() => setZoom(Math.min(500, zoom + 10))}>
              <Plus size={12} />
            </button>
            <span className="zoom-label">{zoom} %</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
