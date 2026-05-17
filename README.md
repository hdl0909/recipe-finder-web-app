# recipe-finder-web-app
инструкция:  
1)git clone https://github.com/Trofimov44/recipe-finder-web-app recipe-finder-web-app  
2)cd recipe-finder-web-app  
3)docker-compose up -d --build  
4)docker-compose exec backend python manage.py migrate  
5)docker-compose exec backend python manage.py createsuperuser (опционально, если надо через /admin зайти)  
6)cd frontend  
7)npm install 
8)npm run dev -- --host --port 3000 (будет доступно по http://localhost:3000/)
