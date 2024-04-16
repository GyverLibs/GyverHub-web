class TagsWidget extends BaseWidget {
  static wtype = 'tags';
  $el;
  tags = [];

  constructor(data, renderer) {
    super(data, renderer);

    this.makeLayout({
      tag: 'ul',
      name: 'el',
      class: 'tags-ul',
    });

    this.update(data);
  }

  update(data) {
    super.update(data);
    if ('value' in data) {
      this.tags = data.value.length ? data.value.split(';') : [];
      this.#refresh();
    }
    if ('color' in data) this.$el.style.setProperty('--tag-color', hexToCol(data.color));
    if ('disable' in data) this.disable(this.$el, data.disable);
  }

  #refresh() {
    let tags = [];
    for (const i in this.tags) {
      const $tag = makeDOM(null, {
        tag: 'li',
        class: 'tags tags-w',
        children: [
          {
            tag: 'span',
            text: this.tags[i],
          },
          {
            tag: 'span',
            class: 'icon i-tags',
            text: '',
            events: {
              click: async () => {
                if (this.disabled()) return;
                this.tags.splice(i, 1);
                this.#refresh();
                this.set(this.tags.join(';'));
              }
            }
          }
        ],
      });
      tags.push($tag);
    }

    tags.push(makeDOM(null, {
      tag: 'div',
      class: 'add-tag',
      children: [
        {
          tag: 'span',
          class: 'icon i-plugin i-add',
          text: '',//'',
          events: {
            click: async () => {
              if (this.disabled()) return;
              let res = await asyncPrompt('Add');
              if (res !== null) {
                this.tags.push(res);
                this.set(this.tags.join(';'));
                this.#refresh();
              }
            },
          }
        }
      ]
    }));
    this.$el.replaceChildren(...tags);
  }

  static style = `
  .tags-ul {
    margin: 0;
    padding: 0;
    --tag-color: var(--prim);
  }

  .tags-w {
    background: var(--tag-color);
  }

  .add-tag {
    display: inline-flex;
    align-items: center;
    padding: 3px 6px;
    margin: 2px 2px;
    height: 24px;
  }

  .i-add {
    transform: rotate(45deg);
    -webkit-transform: rotate(45deg);
    -moz-transform: rotate(45deg);
    -ms-transform: rotate(45deg);
    -o-transform: rotate(45deg);
    color: var(--tag-color) !important;
  }`;
}