# Step 4: Backend セットアップ（FastAPI + SQLite + SQLAlchemy）

## 📋 このステップでやること

Instagram クローンのバックエンドAPI環境を構築します。
- FastAPI プロジェクトの作成
- SQLite データベースの設定
- SQLAlchemy の設定
- 基本的なエンドポイントの実装

## ✅ 手順

### 4-1) プロジェクト作成
※ 目的: API用の独立ディレクトリを切り、フロントと疎結合にする土台を作る（因果: 後のDocker分離・デプロイが容易になる）。

```bash
# 作業ディレクトリに移動
cd ~/work

# バックエンドプロジェクト用のディレクトリを作成
mkdir insta-clone-api
cd insta-clone-api
```

### 4-2) 仮想環境の作成（推奨）
※ 目的: 依存衝突を避け、環境を再現可能にする。

```bash
# 仮想環境を作成
python3 -m venv venv

# 仮想環境を有効化
source venv/bin/activate  # macOS/Linux
# Windows の場合は: venv\Scripts\activate
```

### 4-3) 依存関係のインストール
※ 目的: FastAPI + SQLAlchemy を最小構成で動かす基盤を用意。

```bash
# FastAPI とその依存関係
pip install fastapi uvicorn[standard] python-dotenv

# SQLAlchemy（データベースORM）
pip install sqlalchemy
```

### 4-4) ディレクトリ構成の作成
※ 目的: app配下に責務ごとにファイルを分け、保守性を確保。

```bash
# app ディレクトリと必要なファイルを作成
mkdir -p app
touch app/__init__.py
touch app/main.py
touch app/db.py
touch app/models.py
touch app/schemas.py
touch app/storage.py
```

### 4-5) データベース設定（app/db.py）
※ 目的: DB接続とSession管理を一元化し、各APIで再利用できるようにする。

`app/db.py` を編集します：

```python
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# データベース接続URL（SQLite）
SQLALCHEMY_DATABASE_URL = "sqlite:///./app.db"

# データベースエンジンの作成（SQLite用の設定を含む）
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    connect_args={"check_same_thread": False}
)

# セッションファクトリーの作成（各リクエストでDBセッションを生成）
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# データベースモデルの基底クラス
Base = declarative_base()
```

### 4-6) データベースモデル（app/models.py）
※ 目的: postsテーブルの構造をコードで定義し、マイグレーション基盤に備える。

`app/models.py` を編集します：

```python
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from app.db import Base

# 投稿データを表すデータベースモデル
class Post(Base):
    __tablename__ = "posts"

    id = Column(Integer, primary_key=True, index=True)  # 投稿ID（主キー）
    image_url = Column(String, nullable=False)  # 画像URL（必須）
    caption = Column(String, nullable=True)  # キャプション（オプション）
    created_at = Column(DateTime(timezone=True), server_default=func.now())  # 作成日時（自動設定）
```

### 4-7) スキーマ定義（app/schemas.py）
※ 目的: 入出力の型を明示し、バリデーションと自動ドキュメント化を行う。

`app/schemas.py` を編集します：

```python
from pydantic import BaseModel
from datetime import datetime

# 投稿データの基本スキーマ（共通フィールド）
class PostBase(BaseModel):
    image_url: str  # 画像URL（必須）
    caption: str | None = None  # キャプション（オプション）

# 新規投稿作成時のリクエストスキーマ
class PostCreate(PostBase):
    pass

# 投稿データのレスポンススキーマ（全フィールドを含む）
class Post(PostBase):
    id: int  # 投稿ID
    created_at: datetime  # 作成日時

    class Config:
        from_attributes = True  # SQLAlchemyモデルから自動変換
```

### 4-8) メインアプリケーション（app/main.py）
※ 目的: CORSやヘルスチェックを含む最小APIを構築し、動作確認の基準点を作る。

`app/main.py` を編集します：

```python
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import os
from dotenv import load_dotenv

from app import models, schemas
from app.db import SessionLocal, engine

# 環境変数の読み込み
load_dotenv()

# データベーステーブルの自動作成
models.Base.metadata.create_all(bind=engine)

# FastAPIアプリケーションのインスタンス作成
app = FastAPI()

# CORS設定（フロントエンドからのアクセスを許可）
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# データベースセッションの依存関係（各エンドポイントでDBセッションを取得）
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ヘルスチェックエンドポイント
@app.get("/health")
def health_check():
    return {"status": "ok"}

# 投稿一覧取得エンドポイント
@app.get("/posts", response_model=List[schemas.Post])
def get_posts(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    # データベースから投稿を取得（作成日時の降順でソート）
    posts = db.query(models.Post).order_by(models.Post.created_at.desc()).offset(skip).limit(limit).all()
    return posts

# 投稿作成エンドポイント（画像アップロード機能はStep 5で実装）
@app.post("/posts", response_model=schemas.Post)
def create_post(post: schemas.PostCreate, db: Session = Depends(get_db)):
    # PydanticモデルからSQLAlchemyモデルに変換
    db_post = models.Post(**post.dict())
    
    # セッションに追加
    db.add(db_post)
    
    # データベースにコミット
    db.commit()
    
    # オブジェクトをリフレッシュ（自動生成されたidやcreated_atを取得）
    db.refresh(db_post)
    
    return db_post
```

### 4-9) 環境変数ファイル（.env）
※ 目的: 環境依存値をコードから分離し、本番/開発を切り替えやすくする。

`.env` ファイルを作成します：

```bash
cat > .env << 'EOF'
ALLOWED_ORIGINS=http://localhost:3000
EOF
```

### 4-10) ローカル起動と動作確認
※ 目的: /health と /docs が通ることを確認し、以降の機能追加の足場にする（因果: ここで失敗を潰すと後続デバッグが楽）。

```bash
# 仮想環境が有効化されていることを確認
# （プロンプトに (venv) が表示されているはず）

# サーバーを起動
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

ブラウザで以下を確認：
- `http://localhost:8000/health` → `{"status": "ok"}` が表示される
- `http://localhost:8000/docs` → Swagger UI が表示される

## ✅ チェックリスト

- [ ] FastAPI プロジェクトが作成された
- [ ] 仮想環境が作成され、有効化された
- [ ] 必要なパッケージがインストールされた
- [ ] `app/db.py` でデータベース接続が設定された
- [ ] `app/models.py` で Post モデルが定義された
- [ ] `app/schemas.py` で Pydantic スキーマが定義された
- [ ] `app/main.py` で基本的なエンドポイントが実装された
- [ ] `/health` エンドポイントが動作する
- [ ] `/docs` で Swagger UI が表示される

## 🎯 次のステップ

バックエンドの基本設定が完了したら、**step5.md** に進んでください。
（画像保存：Supabase Storage の設定）

