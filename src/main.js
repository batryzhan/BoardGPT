import { render } from 'preact';
import { html } from 'htm/preact';
import { App } from './components/App.js';
import { BoardProvider } from './context/Store.js';

render(
    html`
        <${BoardProvider}>
            <${App} />
        <//>
    `,
    document.getElementById('root')
);
