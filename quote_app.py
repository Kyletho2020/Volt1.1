import json
from pathlib import Path
import tkinter as tk
from tkinter import messagebox
from datetime import datetime

DATA_FILE = Path('quotes.json')


def load_quotes():
    if DATA_FILE.exists():
        try:
            with DATA_FILE.open() as f:
                return json.load(f)
        except json.JSONDecodeError:
            return []
    return []


def save_quotes(quotes):
    with DATA_FILE.open('w') as f:
        json.dump(quotes, f, indent=2)


def add_quote():
    text = quote_entry.get().strip()
    author = author_entry.get().strip() or 'Unknown'
    if not text:
        messagebox.showwarning('Missing Text', 'Please enter a quote.')
        return
    quotes.append({'text': text, 'author': author, 'timestamp': datetime.utcnow().isoformat()})
    save_quotes(quotes)
    update_listbox()
    quote_entry.delete(0, tk.END)
    author_entry.delete(0, tk.END)


def update_listbox():
    listbox.delete(0, tk.END)
    for q in quotes:
        listbox.insert(tk.END, f"{q['author']}: {q['text'][:40]}" + ("..." if len(q['text']) > 40 else ''))


def on_select(event):
    if not listbox.curselection():
        return
    idx = listbox.curselection()[0]
    q = quotes[idx]
    quote_entry.delete(0, tk.END)
    quote_entry.insert(0, q['text'])
    author_entry.delete(0, tk.END)
    author_entry.insert(0, q['author'])


quotes = load_quotes()

root = tk.Tk()
root.title('Quote Manager')

# Layout frames
left_frame = tk.Frame(root)
left_frame.pack(side=tk.LEFT, fill=tk.Y, padx=5, pady=5)
right_frame = tk.Frame(root)
right_frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=5, pady=5)

# History list
listbox = tk.Listbox(left_frame, width=40)
listbox.pack(fill=tk.BOTH, expand=True)
listbox.bind('<<ListboxSelect>>', on_select)

# Quote input
quote_label = tk.Label(right_frame, text='Quote:')
quote_label.pack(anchor='w')
quote_entry = tk.Entry(right_frame, width=50)
quote_entry.pack(fill=tk.X)

author_label = tk.Label(right_frame, text='Author:')
author_label.pack(anchor='w', pady=(10, 0))
author_entry = tk.Entry(right_frame, width=50)
author_entry.pack(fill=tk.X)

save_button = tk.Button(right_frame, text='Save Quote', command=add_quote)
save_button.pack(pady=10)

update_listbox()

root.mainloop()
