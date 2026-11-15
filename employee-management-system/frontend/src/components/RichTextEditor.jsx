import React, { useRef, useEffect, useState } from 'react';
import {
  Undo,
  Redo,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Indent,
  Outdent,
  Quote,
  RemoveFormatting,
  ChevronDown,
  Palette,
  Code,
  Eye,
} from 'lucide-react';

const FONT_FAMILIES = [
  { label: 'Sans Serif', value: 'Arial, Helvetica, sans-serif' },
  { label: 'Serif', value: 'Georgia, "Times New Roman", serif' },
  { label: 'Fixed Width', value: '"Courier New", Courier, monospace' },
  { label: 'Wide', value: '"Arial Black", sans-serif' },
  { label: 'Narrow', value: '"Arial Narrow", sans-serif' },
  { label: 'Comic Sans MS', value: '"Comic Sans MS", cursive' },
  { label: 'Garamond', value: 'Garamond, serif' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Tahoma', value: 'Tahoma, sans-serif' },
  { label: 'Trebuchet MS', value: '"Trebuchet MS", sans-serif' },
  { label: 'Verdana', value: 'Verdana, sans-serif' },
];

const FONT_SIZES = [
  { label: 'Small', value: '2', px: '10pt' },
  { label: 'Normal', value: '3', px: '12pt' },
  { label: 'Large', value: '5', px: '16pt' },
  { label: 'Huge', value: '7', px: '24pt' },
];

const COLOR_PALETTE = [
  '#000000', '#434343', '#666666', '#999999', '#b7b7b7', '#cccccc', '#d9d9d9', '#ffffff',
  '#980000', '#ff0000', '#ff9900', '#ffff00', '#00ff00', '#00ffff', '#4a86e8', '#0000ff',
  '#9900ff', '#ff00ff', '#e6b8af', '#f4cccc', '#fce5cd', '#fff2cc', '#d9ead3', '#d0e0e3',
  '#c9daf8', '#cfe2f3', '#d9d2e9', '#ead1dc', '#dd7e6b', '#ea9999', '#f9cb9c', '#ffe599',
  '#b6d7a8', '#a2c4c9', '#a4c2f4', '#9fc5e8', '#b4a7d6', '#d5a6bd', '#cc4125', '#e06666',
  '#f6b26b', '#ffd966', '#93c47d', '#76a5af', '#6d9eeb', '#6fa8dc', '#8e7cc3', '#c27ba0',
];

export const RichTextEditor = ({ value, onChange, placeholder = 'Write your email message here...' }) => {
  const editorRef = useRef(null);
  const colorMenuRef = useRef(null);
  const fontMenuRef = useRef(null);
  const sizeMenuRef = useRef(null);
  const alignMenuRef = useRef(null);

  const [activeFont, setActiveFont] = useState('Sans Serif');
  const [activeSize, setActiveSize] = useState('Normal');
  const [activeAlign, setActiveAlign] = useState('left');
  const [showFontMenu, setShowFontMenu] = useState(false);
  const [showSizeMenu, setShowSizeMenu] = useState(false);
  const [showColorMenu, setShowColorMenu] = useState(false);
  const [showAlignMenu, setShowAlignMenu] = useState(false);
  const [colorMode, setColorMode] = useState('text'); // 'text' | 'bg'
  const [htmlMode, setHtmlMode] = useState(false);

  // Sync value into contentEditable when it changes from outside
  useEffect(() => {
    if (editorRef.current && !htmlMode) {
      if (editorRef.current.innerHTML !== (value || '')) {
        editorRef.current.innerHTML = value || '';
      }
    }
  }, [value, htmlMode]);

  // Close menus on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (fontMenuRef.current && !fontMenuRef.current.contains(e.target)) setShowFontMenu(false);
      if (sizeMenuRef.current && !sizeMenuRef.current.contains(e.target)) setShowSizeMenu(false);
      if (colorMenuRef.current && !colorMenuRef.current.contains(e.target)) setShowColorMenu(false);
      if (alignMenuRef.current && !alignMenuRef.current.contains(e.target)) setShowAlignMenu(false);
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleEditorInput = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      // If it's just an empty break tag, treat as empty
      if (html === '<p><br></p>' || html === '<br>') {
        onChange('');
      } else {
        onChange(html);
      }
    }
  };

  const executeCommand = (command, val = null) => {
    if (htmlMode) return;
    editorRef.current?.focus();
    document.execCommand(command, false, val);
    handleEditorInput();
  };

  const applyFont = (font) => {
    setActiveFont(font.label);
    setShowFontMenu(false);
    executeCommand('fontName', font.value);
  };

  const applySize = (size) => {
    setActiveSize(size.label);
    setShowSizeMenu(false);
    executeCommand('fontSize', size.value);
  };

  const applyColor = (color) => {
    setShowColorMenu(false);
    if (colorMode === 'text') {
      executeCommand('foreColor', color);
    } else {
      executeCommand('hiliteColor', color);
    }
  };

  const applyAlign = (align) => {
    setActiveAlign(align);
    setShowAlignMenu(false);
    if (align === 'left') executeCommand('justifyLeft');
    else if (align === 'center') executeCommand('justifyCenter');
    else if (align === 'right') executeCommand('justifyRight');
    else if (align === 'justify') executeCommand('justifyFull');
  };

  const isEmpty = !value || value.replace(/<[^>]*>/g, '').trim() === '';

  return (
    <div className="w-full border border-slate-200 rounded-xl bg-white shadow-xs overflow-hidden focus-within:ring-2 focus-within:ring-sky-500/40 focus-within:border-sky-500 transition">
      {/* Gmail-Style Rich Text Toolbar */}
      <div className="flex flex-wrap items-center gap-1 px-2.5 py-1.5 bg-[#f0f4f9] border-b border-slate-200 select-none text-slate-700">
        {/* Undo / Redo */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            executeCommand('undo');
          }}
          disabled={htmlMode}
          title="Undo (Ctrl+Z)"
          className="p-1.5 hover:bg-slate-200/80 rounded-md transition text-slate-600 disabled:opacity-40"
        >
          <Undo className="w-4 h-4" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            executeCommand('redo');
          }}
          disabled={htmlMode}
          title="Redo (Ctrl+Y)"
          className="p-1.5 hover:bg-slate-200/80 rounded-md transition text-slate-600 disabled:opacity-40"
        >
          <Redo className="w-4 h-4" />
        </button>

        {/* Divider */}
        <div className="w-px h-5 bg-slate-300 mx-1" />

        {/* Font Family Dropdown */}
        <div className="relative" ref={fontMenuRef}>
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              setShowFontMenu((p) => !p);
            }}
            disabled={htmlMode}
            title="Font family"
            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium hover:bg-slate-200/80 rounded-md transition disabled:opacity-40"
          >
            <span className="truncate max-w-[85px]">{activeFont}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
          </button>
          {showFontMenu && (
            <div className="absolute left-0 mt-1 w-44 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-30 max-h-60 overflow-y-auto">
              {FONT_FAMILIES.map((font) => (
                <button
                  key={font.label}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    applyFont(font);
                  }}
                  style={{ fontFamily: font.value }}
                  className={`w-full text-left px-3 py-1.5 text-xs hover:bg-slate-100 transition ${
                    activeFont === font.label ? 'font-bold bg-sky-50 text-sky-700' : 'text-slate-700'
                  }`}
                >
                  {font.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="w-px h-5 bg-slate-300 mx-1" />

        {/* Font Size Dropdown (Tᴛ) */}
        <div className="relative" ref={sizeMenuRef}>
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              setShowSizeMenu((p) => !p);
            }}
            disabled={htmlMode}
            title="Font size"
            className="inline-flex items-center gap-0.5 px-2 py-1 text-xs font-semibold hover:bg-slate-200/80 rounded-md transition disabled:opacity-40"
          >
            <span className="tracking-tighter text-sm font-serif">T<span className="text-[10px]">ᴛ</span></span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 ml-0.5" />
          </button>
          {showSizeMenu && (
            <div className="absolute left-0 mt-1 w-32 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-30">
              {FONT_SIZES.map((size) => (
                <button
                  key={size.label}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    applySize(size);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs hover:bg-slate-100 transition flex items-center justify-between ${
                    activeSize === size.label ? 'font-bold bg-sky-50 text-sky-700' : 'text-slate-700'
                  }`}
                >
                  <span>{size.label}</span>
                  <span className="text-[10px] text-slate-400">{size.px}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="w-px h-5 bg-slate-300 mx-1" />

        {/* Bold */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            executeCommand('bold');
          }}
          disabled={htmlMode}
          title="Bold (Ctrl+B)"
          className="p-1.5 hover:bg-slate-200/80 rounded-md transition text-slate-700 disabled:opacity-40"
        >
          <Bold className="w-4 h-4" />
        </button>

        {/* Italic */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            executeCommand('italic');
          }}
          disabled={htmlMode}
          title="Italic (Ctrl+I)"
          className="p-1.5 hover:bg-slate-200/80 rounded-md transition text-slate-700 disabled:opacity-40"
        >
          <Italic className="w-4 h-4" />
        </button>

        {/* Underline */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            executeCommand('underline');
          }}
          disabled={htmlMode}
          title="Underline (Ctrl+U)"
          className="p-1.5 hover:bg-slate-200/80 rounded-md transition text-slate-700 disabled:opacity-40"
        >
          <Underline className="w-4 h-4" />
        </button>

        {/* Text Color / Background Color Dropdown (A) */}
        <div className="relative" ref={colorMenuRef}>
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              setShowColorMenu((p) => !p);
            }}
            disabled={htmlMode}
            title="Text color / Highlight color"
            className="inline-flex items-center gap-0.5 px-1.5 py-1 hover:bg-slate-200/80 rounded-md transition disabled:opacity-40"
          >
            <div className="flex flex-col items-center leading-none">
              <span className="font-bold text-xs">A</span>
              <span className="w-3.5 h-0.5 bg-sky-600 rounded-full mt-0.5"></span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
          </button>
          {showColorMenu && (
            <div className="absolute left-0 mt-1 w-64 bg-white border border-slate-200 rounded-xl shadow-xl p-3 z-30 space-y-2">
              <div className="flex border-b border-slate-100 pb-2 gap-2 text-xs font-semibold">
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setColorMode('text');
                  }}
                  className={`flex-1 py-1 text-center rounded-md transition ${
                    colorMode === 'text' ? 'bg-sky-50 text-sky-700' : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  Text Color
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setColorMode('bg');
                  }}
                  className={`flex-1 py-1 text-center rounded-md transition ${
                    colorMode === 'bg' ? 'bg-sky-50 text-sky-700' : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  Background
                </button>
              </div>
              <div className="grid grid-cols-8 gap-1.5 pt-1">
                {COLOR_PALETTE.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      applyColor(c);
                    }}
                    style={{ backgroundColor: c }}
                    className="w-5 h-5 rounded border border-slate-300 hover:scale-125 transition shadow-2xs"
                    title={c}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="w-px h-5 bg-slate-300 mx-1" />

        {/* Alignment Dropdown */}
        <div className="relative" ref={alignMenuRef}>
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              setShowAlignMenu((p) => !p);
            }}
            disabled={htmlMode}
            title="Text align"
            className="inline-flex items-center gap-0.5 p-1.5 hover:bg-slate-200/80 rounded-md transition text-slate-700 disabled:opacity-40"
          >
            {activeAlign === 'center' && <AlignCenter className="w-4 h-4" />}
            {activeAlign === 'right' && <AlignRight className="w-4 h-4" />}
            {activeAlign === 'justify' && <AlignJustify className="w-4 h-4" />}
            {activeAlign === 'left' && <AlignLeft className="w-4 h-4" />}
            <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
          </button>
          {showAlignMenu && (
            <div className="absolute left-0 mt-1 w-36 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-30">
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  applyAlign('left');
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100"
              >
                <AlignLeft className="w-4 h-4" />
                <span>Left</span>
              </button>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  applyAlign('center');
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100"
              >
                <AlignCenter className="w-4 h-4" />
                <span>Center</span>
              </button>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  applyAlign('right');
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100"
              >
                <AlignRight className="w-4 h-4" />
                <span>Right</span>
              </button>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  applyAlign('justify');
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100"
              >
                <AlignJustify className="w-4 h-4" />
                <span>Justify</span>
              </button>
            </div>
          )}
        </div>

        {/* Numbered List */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            executeCommand('insertOrderedList');
          }}
          disabled={htmlMode}
          title="Numbered list"
          className="p-1.5 hover:bg-slate-200/80 rounded-md transition text-slate-700 disabled:opacity-40"
        >
          <ListOrdered className="w-4 h-4" />
        </button>

        {/* Bulleted List */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            executeCommand('insertUnorderedList');
          }}
          disabled={htmlMode}
          title="Bulleted list"
          className="p-1.5 hover:bg-slate-200/80 rounded-md transition text-slate-700 disabled:opacity-40"
        >
          <List className="w-4 h-4" />
        </button>

        {/* Indent Less */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            executeCommand('outdent');
          }}
          disabled={htmlMode}
          title="Indent less"
          className="p-1.5 hover:bg-slate-200/80 rounded-md transition text-slate-700 disabled:opacity-40"
        >
          <Outdent className="w-4 h-4" />
        </button>

        {/* Indent More */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            executeCommand('indent');
          }}
          disabled={htmlMode}
          title="Indent more"
          className="p-1.5 hover:bg-slate-200/80 rounded-md transition text-slate-700 disabled:opacity-40"
        >
          <Indent className="w-4 h-4" />
        </button>

        {/* Quote Block */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            executeCommand('formatBlock', 'blockquote');
          }}
          disabled={htmlMode}
          title="Quote"
          className="p-1.5 hover:bg-slate-200/80 rounded-md transition text-slate-700 disabled:opacity-40"
        >
          <Quote className="w-4 h-4" />
        </button>

        {/* Divider */}
        <div className="w-px h-5 bg-slate-300 mx-1" />

        {/* Strikethrough */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            executeCommand('strikeThrough');
          }}
          disabled={htmlMode}
          title="Strikethrough"
          className="p-1.5 hover:bg-slate-200/80 rounded-md transition text-slate-700 disabled:opacity-40"
        >
          <Strikethrough className="w-4 h-4" />
        </button>

        {/* Remove Formatting */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            executeCommand('removeFormat');
          }}
          disabled={htmlMode}
          title="Remove formatting"
          className="p-1.5 hover:bg-slate-200/80 rounded-md transition text-slate-700 disabled:opacity-40"
        >
          <RemoveFormatting className="w-4 h-4" />
        </button>

        {/* HTML / Raw Toggle button */}
        <div className="ml-auto flex items-center">
          <button
            type="button"
            onClick={() => setHtmlMode((prev) => !prev)}
            title={htmlMode ? 'Switch to Rich Text Editor' : 'Switch to HTML Code View'}
            className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg transition border ${
              htmlMode
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-300'
            }`}
          >
            {htmlMode ? (
              <>
                <Eye className="w-3.5 h-3.5" />
                <span>Visual</span>
              </>
            ) : (
              <>
                <Code className="w-3.5 h-3.5" />
                <span>HTML</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Editor Content Area */}
      <div className="relative min-h-[220px] max-h-[500px] overflow-y-auto bg-white">
        {htmlMode ? (
          <textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            rows={9}
            className="w-full h-full min-h-[220px] p-4 font-mono text-xs text-slate-800 bg-slate-900 text-slate-100 focus:outline-none resize-y"
            placeholder="<div>Enter raw HTML code here...</div>"
          />
        ) : (
          <>
            {isEmpty && (
              <div className="absolute top-4 left-4 text-slate-400 text-sm pointer-events-none select-none">
                {placeholder}
              </div>
            )}
            <div
              ref={editorRef}
              contentEditable
              onInput={handleEditorInput}
              onBlur={handleEditorInput}
              className="min-h-[220px] p-4 text-sm text-slate-800 focus:outline-none focus:ring-0 leading-relaxed [&_ul]:list-disc [&_ul]:ml-6 [&_ol]:list-decimal [&_ol]:ml-6 [&_blockquote]:border-l-4 [&_blockquote]:border-slate-300 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-slate-600"
              style={{ minHeight: '220px' }}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default RichTextEditor;

