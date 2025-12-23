# Step 5: 画像保存（Supabase Storage）の設定

## 📋 このステップでやること

画像を保存するために Supabase Storage を設定し、API 側に画像アップロード機能を実装します。

## ✅ 手順

### 5-1) Supabase プロジェクトの作成
※ 目的: 画像保存先を確保し、後続のアップロードAPIで使う認証情報を用意。

1. [Supabase](https://supabase.com/) にアクセスしてアカウントを作成（またはログイン）

2. 新しいプロジェクトを作成：
   - **Project Name**: `insta-clone`（任意）
   - **Database Password**: 安全なパスワードを設定
   - **Region**: 最寄りのリージョンを選択

3. プロジェクトが作成されたら、以下を控えておきます：
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon/public key**: Settings → API → `anon public` キー

### 5-2) Storage Bucket の作成
※ 目的: 画像を置く公開バケットを準備し、URLで配信できる状態にする。

1. Supabase ダッシュボードで **Storage** を開く

2. **Create a new bucket** をクリック

3. 以下の設定で作成：
   - **Name**: `post-images`
   - **Public bucket**: ✅ **ON**（画像を公開URLでアクセスできるようにする）

4. **Create bucket** をクリック

### 5-3) API 側の環境変数を更新
※ 目的: Supabase接続情報をコードから分離し、デプロイ環境ごとに切り替え可能にする。

`insta-clone-api/.env` を編集します：

```bash
cd ~/work/insta-clone-api
code .env  # または任意のエディタ
```

以下の内容に更新（実際の値に置き換えてください）：

```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_BUCKET=post-images
ALLOWED_ORIGINS=http://localhost:3000
```

### 5-4) Supabase SDK のインストール
※ 目的: Python から Storage へアップロードするためのクライアントを導入。

```bash
# 仮想環境が有効化されていることを確認
cd ~/work/insta-clone-api
source venv/bin/activate  # まだ有効化していない場合

# Supabase SDK をインストール
pip install supabase
```

### 5-5) 画像アップロード関数の実装（app/storage.py）
※ 目的: バケットへのアップロードと公開URL取得を共通関数化し、API本体をシンプルに保つ。

`app/storage.py` を編集します：

```python
import os
from supabase import create_client, Client
from fastapi import UploadFile
import uuid

# 環境変数からSupabaseの設定を取得
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY")
BUCKET_NAME = os.getenv("SUPABASE_BUCKET", "post-images")

# Supabaseクライアントの作成
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# 画像をSupabase Storageにアップロードし、公開URLを返す
async def upload_image(file: UploadFile) -> str:
    # ファイル拡張子の取得
    file_extension = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    
    # 一意なファイル名の生成（UUIDを使用）
    file_name = f"{uuid.uuid4()}.{file_extension}"
    
    # ファイル内容の読み込み
    file_content = await file.read()
    
    # Supabase Storageへのアップロード
    response = supabase.storage.from_(BUCKET_NAME).upload(
        file_name,
        file_content,
        file_options={"content-type": file.content_type or "image/jpeg"}
    )
    
    # エラーチェック
    if response.get("error"):
        raise Exception(f"アップロードエラー: {response['error']}")
    
    # 公開URLの取得
    public_url = supabase.storage.from_(BUCKET_NAME).get_public_url(file_name)
    
    return public_url
```

### 5-6) API エンドポイントの更新（app/main.py）
※ 目的: フォームデータで受けた画像をStorageへ送り、DBへメタデータを保存する流れを実装。

`app/main.py` を更新して、画像アップロード機能を追加します：

```python
# 
# 【意味】必要なライブラリのインポート
# 【因果】UploadFile, File, Form でファイルアップロードとフォームデータを受け取る
# 【学び】File(...) でファイルを必須パラメータに、Form(...) でフォームデータを受け取る
#
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import os
from dotenv import load_dotenv

from app import models, schemas
from app.db import SessionLocal, engine
from app.storage import upload_image

# ... 既存のコード ...

# 投稿作成エンドポイント（画像アップロード対応）
@app.post("/posts", response_model=schemas.Post)
async def create_post(
    file: UploadFile = File(...),  # アップロードされた画像ファイル（必須）
    caption: str = Form(""),  # キャプション（オプション）
    db: Session = Depends(get_db)
):
    # 画像をSupabase Storageにアップロード
    try:
        image_url = await upload_image(file)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"画像のアップロードに失敗しました: {str(e)}")
    
    # データベースに投稿を保存
    db_post = models.Post(
        image_url=image_url,
        caption=caption if caption else None
    )
    
    db.add(db_post)
    db.commit()
    db.refresh(db_post)
    
    return db_post
```

### 5-7) 動作確認
※ 目的: curlでの手動テストにより、アップロード→URL応答までの因果を検証し、不具合を早期発見。

サーバーを再起動して、動作を確認します：

```bash
# サーバーを起動（既に起動している場合は再起動）
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**curl でテスト**（別のターミナルで実行）：

```bash
# テスト用の画像ファイルを用意（任意の画像ファイルのパスに置き換えてください）
curl -X POST "http://localhost:8000/posts" \
  -F "caption=テスト投稿" \
  -F "file=@/path/to/your/image.jpg"
```

成功すると、以下のようなレスポンスが返ってきます：

```json
{
  "id": 1,
  "image_url": "https://xxxxx.supabase.co/storage/v1/object/public/post-images/xxxxx.jpg",
  "caption": "テスト投稿",
  "created_at": "2024-01-01T12:00:00"
}
```

ブラウザで `image_url` を開いて、画像が表示されることを確認してください。

## ✅ チェックリスト

- [ ] Supabase プロジェクトが作成された
- [ ] Project URL と anon key を控えた
- [ ] Storage bucket `post-images` が作成された（Public ON）
- [ ] `.env` ファイルに Supabase の設定が追加された
- [ ] Supabase SDK がインストールされた
- [ ] `app/storage.py` に画像アップロード関数が実装された
- [ ] `app/main.py` の POST /posts エンドポイントが更新された
- [ ] curl で画像アップロードが成功した
- [ ] アップロードした画像のURLがブラウザで表示できる

## 🎯 次のステップ

画像アップロード機能が動作したら、**step6.md** に進んでください。
（Frontend と Backend の連携）

