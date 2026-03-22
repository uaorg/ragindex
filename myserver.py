#!/usr/bin/env python3
# -*- coding: utf-8 -*-
from livereload import Server

def serve():
    server = Server()

    # Monitoraggio RICORSIVO di tutte le tue cartelle 'static'
    # Il pattern **/ indica di cercare in ogni sottodirectory
    
    # Monitora i file LESS (che il tuo browser compila al volo)
    server.watch('static/less/**/*.less')
    
    # Monitora HTML, JS e CSS (per ogni evenienza)
    server.watch('static/html/**/*.html')
    server.watch('static/js/**/*.js')
    server.watch('static/css/**/*.css')

    print("🚀 Live Server attivo (Client-side LESS)")
    print("Puntando a: http://localhost:5500/static/html/tuo_file.html")
    
    # Avvia il server nella root del progetto
    server.serve(port=8080, root='.')

if __name__ == '__main__':
    serve()