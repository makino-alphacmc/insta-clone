# Step 3: Frontend モック画面の作成

## 📋 このステップでやること

API がまだない状態でも、UI を確認できるようにモック画面を作成します。

- タイムライン画面（投稿一覧）- 3列レイアウト（PC向け）
- 新規投稿画面
- 各状態の実装（ローディング、エラー、空状態）

## ✅ 手順

### 3-1) タイムライン画面（pages/index.vue）

モックデータを画面に流し込み、3列レイアウトで一覧UIを実装します。

`pages/index.vue` を編集します：

```vue
<template>
	<!-- 背景とコンテナ（PC向け） -->
	<div class="min-h-screen bg-gray-50">
		<!-- ヘッダー部分 -->
		<header class="bg-white border-b border-gray-200">
			<div class="container mx-auto max-w-7xl px-4 py-4">
				<div class="flex justify-between items-center">
					<h1 class="text-2xl font-bold">Instagram Clone</h1>
					<!-- 新規投稿ボタン -->
					<Button as-child>
						<NuxtLink to="/post/new">新規投稿</NuxtLink>
					</Button>
				</div>
			</div>
		</header>

		<!-- メインコンテンツ -->
		<main class="container mx-auto max-w-7xl px-4 py-8">
			<!-- 空状態 -->
			<div v-if="posts.length === 0" class="text-center py-20">
				<div class="mb-4">
					<div class="w-20 h-20 mx-auto bg-gray-100 rounded-lg flex items-center justify-center">
						<svg class="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
						</svg>
					</div>
				</div>
				<p class="text-lg text-gray-500 mb-2">まだ投稿がありません</p>
				<p class="text-sm text-gray-400 mb-6">最初の投稿を作成して、みんなとシェアしましょう</p>
				<Button as-child>
					<NuxtLink to="/post/new">最初の投稿を作成</NuxtLink>
				</Button>
			</div>

			<!-- 投稿一覧（3列グリッドレイアウト） -->
			<div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				<Card v-for="post in posts" :key="post.id" class="overflow-hidden">
					<!-- ヘッダー部分（アバター + ユーザー名 + 日時） -->
					<CardHeader class="pb-3">
						<div class="flex items-center gap-3">
							<Avatar>
								<AvatarFallback>{{ post.username?.charAt(0) || 'U' }}</AvatarFallback>
							</Avatar>
							<div class="flex-1">
								<p class="font-semibold text-sm">{{ post.username || 'User' }}</p>
								<p class="text-xs text-gray-500">{{ formatDate(post.created_at) }}</p>
							</div>
						</div>
					</CardHeader>

					<!-- 画像エリア -->
					<CardContent class="p-0">
						<img
							:src="post.image_url"
							:alt="post.caption || '投稿画像'"
							class="w-full aspect-square object-cover"
						/>
					</CardContent>

					<!-- フッター部分（キャプション） -->
					<CardFooter class="flex flex-col items-start gap-2 pt-3">
						<p class="font-semibold text-sm">{{ post.username || 'User' }}</p>
						<p class="text-sm text-gray-700">{{ post.caption || '' }}</p>
					</CardFooter>
				</Card>
			</div>
		</main>
	</div>
</template>

<script setup>
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'

// モックデータ（後でAPIから取得するデータに置き換える）
const posts = [
	{
		id: 1,
		image_url: 'https://via.placeholder.com/480x480?text=Post+1',
		caption: 'これは最初の投稿です！',
		username: 'user1',
		created_at: new Date().toISOString(),
	},
	{
		id: 2,
		image_url: 'https://via.placeholder.com/480x480?text=Post+2',
		caption: '2つ目の投稿です',
		username: 'user2',
		created_at: new Date(Date.now() - 3600000).toISOString(),
	},
	{
		id: 3,
		image_url: 'https://via.placeholder.com/480x480?text=Post+3',
		caption: '3つ目の投稿です',
		username: 'user3',
		created_at: new Date(Date.now() - 7200000).toISOString(),
	},
]

// 日付を日本語形式に変換する関数
const formatDate = (dateString) => {
	const date = new Date(dateString)
	return date.toLocaleDateString('ja-JP', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	})
}
</script>
```

### 3-2) 新規投稿画面（pages/post/new.vue）

フォーム入力とプレビューの流れを実装します。

`pages/post/new.vue` を作成します：

```vue
<template>
	<!-- 背景とコンテナ -->
	<div class="min-h-screen bg-gray-50">
		<!-- ヘッダー部分 -->
		<header class="bg-white border-b border-gray-200">
			<div class="container mx-auto max-w-4xl px-4 py-4">
				<div class="flex items-center gap-4">
					<!-- 戻るボタン -->
					<Button variant="ghost" size="icon" @click="$router.push('/')">
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
						</svg>
					</Button>
					<h1 class="text-xl font-semibold">新規投稿</h1>
				</div>
			</div>
		</header>

		<!-- メインコンテンツ -->
		<main class="container mx-auto max-w-4xl px-4 py-8">
			<Card>
				<CardHeader>
					<CardTitle>投稿を作成</CardTitle>
				</CardHeader>
				<CardContent>
					<form @submit.prevent="handleSubmit" class="space-y-6">
						<!-- 画像選択セクション -->
						<div class="space-y-2">
							<Label for="image">画像を選択</Label>
							<p class="text-sm text-gray-500">JPEG、PNG形式の画像をアップロードできます（最大10MB）</p>
							
							<!-- ファイル入力エリア（ドラッグ&ドロップ対応風） -->
							<div class="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
								<Input
									id="image"
									type="file"
									accept="image/*"
									@change="handleFileChange"
									class="hidden"
								/>
								<label for="image" class="cursor-pointer">
									<div class="space-y-4">
										<Button type="button" variant="default">ファイルを選択</Button>
										<p class="text-sm text-gray-500">または、ここにドラッグ&ドロップ</p>
									</div>
								</label>
							</div>

							<!-- プレビュー画像 -->
							<div v-if="previewUrl" class="mt-4">
								<img
									:src="previewUrl"
									alt="プレビュー"
									class="w-full max-h-96 object-contain rounded-lg border border-gray-200"
								/>
							</div>
						</div>

						<!-- キャプション入力セクション -->
						<div class="space-y-2">
							<Label for="caption">キャプション</Label>
							<p class="text-sm text-gray-500">投稿に説明文を追加できます（任意）</p>
							<Textarea
								id="caption"
								v-model="caption"
								placeholder="キャプションを入力..."
								rows="4"
								:maxlength="500"
							/>
							<p class="text-xs text-gray-400 text-right">{{ caption.length }} / 500</p>
						</div>

						<!-- ボタンエリア -->
						<div class="flex gap-4">
							<Button type="submit" :disabled="!selectedFile" class="flex-1">
								投稿する
							</Button>
							<Button type="button" variant="outline" @click="$router.push('/')" class="flex-1">
								キャンセル
							</Button>
						</div>
					</form>
				</CardContent>
			</Card>
		</main>
	</div>
</template>

<script setup>
import { ref } from 'vue'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

// リアクティブな状態変数
const selectedFile = ref(null) // 選択されたファイル
const previewUrl = ref(null) // プレビュー用のURL
const caption = ref('') // キャプションのテキスト

// ファイル選択時の処理
const handleFileChange = (event) => {
	const file = event.target.files[0]
	if (file) {
		selectedFile.value = file
		// プレビュー用のURLを作成
		previewUrl.value = URL.createObjectURL(file)
	}
}

// フォーム送信時の処理（モック実装）
const handleSubmit = () => {
	// TODO: ここでAPIを呼び出す（Step 6で実装）
	alert('投稿機能はまだ実装されていません（Step 6で実装します）')
}
</script>
```

### 3-3) レイアウトの設定（app.vue）

共通レイアウトを設定します：

```vue
<template>
	<div class="min-h-screen bg-gray-50">
		<slot />
	</div>
</template>
```

## ✅ チェックリスト

- [ ] タイムライン画面（`pages/index.vue`）が作成された
- [ ] 3列グリッドレイアウトで投稿が表示される
- [ ] モックデータが表示される
- [ ] 空状態が表示される
- [ ] 新規投稿画面（`pages/post/new.vue`）が作成された
- [ ] 画像選択とプレビューが動作する
- [ ] 「新規投稿」ボタンから投稿画面に遷移できる
- [ ] 投稿画面からトップページに戻れる

## 🎯 次のステップ

モック画面が完成したら、**step4.md** に進んでください。
（Backend セットアップ：FastAPI プロジェクトの作成）
