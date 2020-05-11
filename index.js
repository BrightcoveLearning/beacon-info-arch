// document.querySelectorAll('label').forEach((label) => {
//   label.contentEditable = true;
// });

// workflow
document.querySelectorAll('button.next').forEach((button) => {
  button.addEventListener('click', () => {
    const sections = document.querySelectorAll('section');

    // find the active section
    let i = 0;
    for (; i < sections.length; i++) {
      if (!sections[i].hidden) {
        break;
      }
    }
    // make the next section active
    if (sections[i] && sections[i + 1]) {
      sections[i].hidden = true;
      sections[i + 1].hidden = false;
    }
    // show the footer if we've reached the end
    if (i + 1 == sections.length - 1) {
      document.querySelector('footer').hidden = false;
    }
  });
});

// ----------------------------------- layout ----------------------------------

// read the DOM to determine the available blocks and their ordering
function scrapeNav() {
  const names = {};
  const order = [].concat(...document.querySelectorAll('.layout-nav > li')).map((li) => {
    return li.innerText.trim();
  }).filter((name) => {
    return name !== '${name}';
  }).map((name) => {
    return {
      name,
      layout: 'carousel'
    };
  });
  order.forEach((block) => {
    names[block.name] = block;
  });
  return { names, order };
}
// read the DOM to determine the layout selection for each block
function scrapeLayout(model) {
  for (let block of document.querySelectorAll('.block-layout')) {
    const name = block.querySelector('h3').innerText.trim();
    const layout =
          [].concat(...block.querySelectorAll('input[name=favorites-block]'))
          .filter((input) => input.checked)[0].value;

    if (model.names[name]) {
      // only update layout for all the blocks that still exist in the
      // nav
      model.names[name].layout = layout;
    }
  }
}
function renderNavUpdate() {
  const modelUpdate = scrapeNav();
  scrapeLayout(modelUpdate);

  model = modelUpdate;
  renderLayout(modelUpdate);
}
// the ugliest template system ever
function render(template, model) {
  return template.outerHTML.replace(/\${([^}]+)}/g, (match, variable) => {
    return model[variable] || variable;
  });
}

const layout = document.getElementById('layout');
const layoutTemplate = layout.firstElementChild;

const layoutNav = document.querySelector('.layout-nav');
const navTemplate = layoutNav.lastElementChild;
const sortableNav = Sortable.create(layoutNav, {
  onUpdate: renderNavUpdate
});

let model = scrapeNav();
model.order[1].layout = 'grid'; // make things visually interesting to start

function renderLayout(model) {
  layout.innerHTML = model.order.map(render.bind(null, layoutTemplate)).join('\n');
  for (let child of layout.children) {
    const style = child.querySelector('.carousel') ? 'carousel' : 'grid';
    child.querySelector(`input[value=${style}]`).checked = true;
  }

  document.querySelectorAll('form.block-layout').forEach((form) => {
    form.addEventListener('change', () => {
      const layout = [].concat(...form.querySelectorAll('input[type=radio]')).filter((input) => {
        return input.checked;
      })[0];
      const block = form.closest('li').querySelector('.carousel, .grid');

      block.classList.remove('carousel');
      block.classList.remove('grid');
      block.classList.add(layout.value);
    });
  });
}
function renderNav(model) {
  layoutNav.innerHTML =
    model.order.map(render.bind(null, navTemplate)).join('\n');

  layoutNav.querySelectorAll('.remove-block').forEach((button) => {
    button.addEventListener('click', (event) => {
      const item = button.closest('li');
      item.parentElement.removeChild(item);

      renderNavUpdate();
    });
  });
}

renderLayout(model);
renderNav(model);

document.querySelector('#add-block').addEventListener('submit', (event) => {
  event.preventDefault();

  const input = event.target.querySelector('input[name=add-block]');
  const name = input.value.trim();
  const block = {
    name,
    layout: 'carousel'
  };

  model.names[name] = block;
  model.order.push(block);

  renderLayout(model);
  renderNav(model);

  input.value = '';
});

// ugly data export
document.querySelector('#export-data').addEventListener('click', (event) => {
  alert(JSON.stringify(model.order));
});
