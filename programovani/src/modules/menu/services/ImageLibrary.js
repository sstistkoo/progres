/**
 * Image Library Service
 * Handles image management and placeholders
 */

import { eventBus } from '../../../core/events.js';

export class ImageLibrary {
  /**
   * Get image categories
   */
  static getImageCategories() {
    return {
      placeholder: {
        name: 'Placeholder',
        images: [
          { name: 'Placeholder 400x300', url: 'https://via.placeholder.com/400x300', width: 400, height: 300 },
          { name: 'Placeholder 800x600', url: 'https://via.placeholder.com/800x600', width: 800, height: 600 },
          { name: 'Placeholder 1200x800', url: 'https://via.placeholder.com/1200x800', width: 1200, height: 800 }
        ]
      },
      unsplash: {
        name: 'Unsplash (Random)',
        images: [
          { name: 'Nature', url: 'https://source.unsplash.com/random/800x600?nature', width: 800, height: 600 },
          { name: 'City', url: 'https://source.unsplash.com/random/800x600?city', width: 800, height: 600 },
          { name: 'Food', url: 'https://source.unsplash.com/random/800x600?food', width: 800, height: 600 },
          { name: 'Technology', url: 'https://source.unsplash.com/random/800x600?technology', width: 800, height: 600 },
          { name: 'People', url: 'https://source.unsplash.com/random/800x600?people', width: 800, height: 600 }
        ]
      },
      picsum: {
        name: 'Lorem Picsum',
        images: [
          { name: 'Random 400x300', url: 'https://picsum.photos/400/300', width: 400, height: 300 },
          { name: 'Random 800x600', url: 'https://picsum.photos/800/600', width: 800, height: 600 },
          { name: 'Grayscale', url: 'https://picsum.photos/800/600?grayscale', width: 800, height: 600 }
        ]
      }
    };
  }

  /**
   * Generate image code
   */
  static generateImageCode(url, width, height, alt = 'Image') {
    return `<img src="${url}" alt="${alt}" width="${width}" height="${height}" style="max-width: 100%; height: auto;" />`;
  }

  /**
   * Insert image into editor
   */
  static insertImage(url, width, height, alt) {
    const code = this.generateImageCode(url, width, height, alt);
    eventBus.emit('editor:insert', code);
    eventBus.emit('toast:show', {
      message: '✅ Obrázek vložen',
      type: 'success'
    });
  }
}
