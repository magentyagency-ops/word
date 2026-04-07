import { Node, mergeAttributes, InputRule } from '@tiptap/core';

export const FileAttachment = Node.create({
  name: 'fileAttachment',
  group: 'inline',
  inline: true,
  selectable: true,
  atom: true,

  addAttributes() {
    return {
      fileName: { default: null },
      fileContent: { default: null }, // Base64 or Text
      status: { default: 'placeholder' }, // 'placeholder' or 'attached'
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-file-attachment]' }];
  },

  renderHTML({ HTMLAttributes }) {
    const { status, fileName } = HTMLAttributes;
    
    if (status === 'attached') {
      return [
        'span', 
        mergeAttributes(HTMLAttributes, { 'data-file-attachment': '', class: 'file-link' }), 
        `📄 ${fileName}`
      ];
    }
    
    return [
      'span', 
      mergeAttributes(HTMLAttributes, { 'data-file-attachment': '', class: 'file-open-btn' }), 
      'open'
    ];
  },

  addInputRules() {
    return [
      new InputRule({
        find: /drop:$/,
        handler: ({ state, range }) => {
          const { tr } = state;
          const start = range.from;
          const end = range.to;

          tr.replaceWith(start, end, this.type.create());
        },
      }),
    ];
  },
});
