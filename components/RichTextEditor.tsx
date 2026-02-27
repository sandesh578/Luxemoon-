'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import { Bold, Italic, List, ListOrdered, Link as LinkIcon, Heading2, Heading3 } from 'lucide-react';
import { useEffect } from 'react';

interface RichTextEditorProps {
    content: string;
    onChange: (html: string) => void;
    placeholder?: string;
}

export function RichTextEditor({ content, onChange, placeholder }: RichTextEditorProps) {
    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit,
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-amber-600 underline font-bold',
                },
            }),
        ],
        content,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'prose-sm max-w-none focus:outline-none min-h-[150px] p-4 bg-white prose-headings:font-serif prose-headings:text-stone-900 prose-p:text-stone-600 prose-strong:text-stone-900',
            },
        },
    });

    // Effect to handle external content changes (e.g. initial load vs edit mode)
    useEffect(() => {
        if (editor && content !== editor.getHTML()) {
            editor.commands.setContent(content);
        }
    }, [content, editor]);

    if (!editor) {
        return null;
    }

    const setLink = () => {
        const previousUrl = editor.getAttributes('link').href;
        const url = window.prompt('URL', previousUrl);

        if (url === null) return;

        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }

        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    };

    return (
        <div className="border border-stone-200 rounded-lg overflow-hidden flex flex-col">
            <div className="bg-stone-50 border-b border-stone-200 p-2 flex flex-wrap gap-1">
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className={`p-1.5 rounded hover:bg-stone-200 transition-colors ${editor.isActive('bold') ? 'bg-stone-200' : ''}`}
                >
                    <Bold className="w-4 h-4" />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={`p-1.5 rounded hover:bg-stone-200 transition-colors ${editor.isActive('italic') ? 'bg-stone-200' : ''}`}
                >
                    <Italic className="w-4 h-4" />
                </button>
                <div className="w-px h-6 bg-stone-300 mx-1 self-center" />
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    className={`p-1.5 rounded hover:bg-stone-200 transition-colors ${editor.isActive('heading', { level: 2 }) ? 'bg-stone-200' : ''}`}
                >
                    <Heading2 className="w-4 h-4" />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                    className={`p-1.5 rounded hover:bg-stone-200 transition-colors ${editor.isActive('heading', { level: 3 }) ? 'bg-stone-200' : ''}`}
                >
                    <Heading3 className="w-4 h-4" />
                </button>
                <div className="w-px h-6 bg-stone-300 mx-1 self-center" />
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    className={`p-1.5 rounded hover:bg-stone-200 transition-colors ${editor.isActive('bulletList') ? 'bg-stone-200' : ''}`}
                >
                    <List className="w-4 h-4" />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    className={`p-1.5 rounded hover:bg-stone-200 transition-colors ${editor.isActive('orderedList') ? 'bg-stone-200' : ''}`}
                >
                    <ListOrdered className="w-4 h-4" />
                </button>
                <div className="w-px h-6 bg-stone-300 mx-1 self-center" />
                <button
                    type="button"
                    onClick={setLink}
                    className={`p-1.5 rounded hover:bg-stone-200 transition-colors ${editor.isActive('link') ? 'bg-stone-200' : ''}`}
                >
                    <LinkIcon className="w-4 h-4" />
                </button>
            </div>
            <div className="max-h-96 overflow-y-auto w-full prose prose-sm max-w-none prose-headings:font-serif">
                <EditorContent editor={editor} className="" />
            </div>
        </div>
    );
}
