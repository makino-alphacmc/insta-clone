# Step 6: Frontend と Backend の連携

## 📋 このステップでやること

フロントエンドのモックデータを削除し、実際の API と連携するように変更します。

- タイムライン画面で API から投稿を取得（3列レイアウト）
- 新規投稿画面で API に投稿を送信
- 各状態の実装（ローディング、エラー、空状態、成功、失敗）

## ✅ 手順

### 6-1) タイムライン画面の更新（pages/index.vue）

モックデータをAPI取得に置き換え、3列レイアウトと各状態を実装します。

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
			<!-- ローディング状態（Skeleton表示） -->
			<div v-if="pending" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				<Card v-for="i in 6" :key="i" class="overflow-hidden">
					<CardHeader class="pb-3">
						<Skeleton class="h-4 w-32" />
					</CardHeader>
					<CardContent class="p-0">
						<Skeleton class="w-full aspect-square" />
					</CardContent>
					<CardFooter class="pt-3">
						<Skeleton class="h-4 w-full" />
					</CardFooter>
				</Card>
			</div>

			<!-- エラー状態（モーダル表示） -->
			<div v-else-if="error" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
				<Card class="w-full max-w-md mx-4">
					<CardHeader class="text-center">
						<div class="w-16 h-16 mx-auto mb-4 bg-red-500 rounded-full flex items-center justify-center">
							<svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
							</svg>
						</div>
						<CardTitle>エラーが発生しました</CardTitle>
					</CardHeader>
					<CardContent class="text-center">
						<p class="text-gray-600 mb-2">投稿の取得に失敗しました。</p>
						<p class="text-sm text-gray-500">ネットワークエラーが発生した可能性があります。</p>
					</CardContent>
					<CardFooter class="justify-center">
						<Button @click="refresh()">再試行</Button>
					</CardFooter>
				</Card>
			</div>

			<!-- 空状態 -->
			<div v-else-if="!posts || posts.length === 0" class="text-center py-20">
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
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

// Nuxtのランタイム設定を取得
const config = useRuntimeConfig()
const apiBase = config.public.apiBase

// APIから投稿を取得
const {
	data: posts,
	pending,
	error,
	refresh,
} = await useFetch(`${apiBase}/posts`)

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

// ページが表示されたときに再取得
onMounted(() => {
	refresh()
})
</script>
```

### 6-2) 新規投稿画面の更新（pages/post/new.vue）

実際のAPIに投稿を送信し、成功/失敗の状態を実装します。

`pages/post/new.vue` を編集します：

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
							
							<!-- ファイル入力エリア -->
							<div class="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
								<Input
									id="image"
									type="file"
									accept="image/*"
									@change="handleFileChange"
									class="hidden"
									:disabled="isSubmitting"
								/>
								<label for="image" class="cursor-pointer">
									<div class="space-y-4">
										<Button type="button" variant="default" :disabled="isSubmitting">ファイルを選択</Button>
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

						<!-- エラーアラート（フォーム内表示） -->
						<Alert v-if="error" variant="destructive">
							<AlertTitle>エラー</AlertTitle>
							<AlertDescription>
								{{ error }}
							</AlertDescription>
						</Alert>

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
								:disabled="isSubmitting"
							/>
							<p class="text-xs text-gray-400 text-right">{{ caption.length }} / 500</p>
						</div>

						<!-- ボタンエリア -->
						<div class="flex gap-4">
							<Button type="submit" :disabled="!selectedFile || isSubmitting" class="flex-1">
								<span v-if="isSubmitting">投稿中...</span>
								<span v-else>投稿する</span>
							</Button>
							<Button type="button" variant="outline" @click="$router.push('/')" :disabled="isSubmitting" class="flex-1">
								キャンセル
							</Button>
						</div>
					</form>
				</CardContent>
			</Card>
		</main>
	</div>

	<!-- 投稿成功モーダル -->
	<div v-if="showSuccessModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
		<Card class="w-full max-w-md mx-4">
			<CardHeader class="text-center">
				<div class="w-16 h-16 mx-auto mb-4 bg-green-500 rounded-full flex items-center justify-center">
					<svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
					</svg>
				</div>
				<CardTitle>投稿が完了しました！</CardTitle>
			</CardHeader>
			<CardContent class="text-center">
				<p class="text-gray-600 mb-2">投稿が正常にアップロードされました</p>
				<p class="text-sm text-gray-500">タイムラインに表示されます</p>
			</CardContent>
			<CardFooter class="justify-center">
				<Button @click="handleSuccessClose">OK</Button>
			</CardFooter>
		</Card>
	</div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from '@/components/ui/sonner'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

// Nuxt/VueのComposablesを取得
const router = useRouter()
const toast = useToast()
const config = useRuntimeConfig()
const apiBase = config.public.apiBase

// リアクティブな状態変数
const selectedFile = ref(null)
const previewUrl = ref(null)
const caption = ref('')
const isSubmitting = ref(false)
const error = ref(null)
const showSuccessModal = ref(false)

// ファイル選択時の処理
const handleFileChange = (event) => {
	const file = event.target.files[0]
	if (file) {
		// ファイルサイズチェック（10MB以下）
		if (file.size > 10 * 1024 * 1024) {
			error.value = '画像サイズは10MB以下にしてください'
			return
		}
		selectedFile.value = file
		error.value = null
		// プレビュー用のURLを作成
		previewUrl.value = URL.createObjectURL(file)
	}
}

// フォーム送信時の処理
const handleSubmit = async () => {
	if (!selectedFile.value) {
		error.value = '画像を選択してください'
		return
	}

	isSubmitting.value = true
	error.value = null

	try {
		// FormDataの作成
		const formData = new FormData()
		formData.append('file', selectedFile.value)
		formData.append('caption', caption.value || '')

		// APIにPOSTリクエスト
		const response = await fetch(`${apiBase}/posts`, {
			method: 'POST',
			body: formData,
		})

		// エラーレスポンスの処理
		if (!response.ok) {
			const errorData = await response.json().catch(() => ({ detail: '投稿に失敗しました' }))
			throw new Error(errorData.detail || '投稿に失敗しました')
		}

		// 成功時の処理
		showSuccessModal.value = true
		toast.success('投稿が完了しました！')
	} catch (err) {
		// エラー処理
		error.value = err.message || '投稿に失敗しました'
		toast.error('投稿に失敗しました')
	} finally {
		isSubmitting.value = false
	}
}

// 成功モーダルを閉じてタイムラインに戻る
const handleSuccessClose = () => {
	showSuccessModal.value = false
	router.push('/')
}
</script>
```

### 6-3) 動作確認

フロントエンドとバックエンドの連携を確認します。

1. **バックエンドサーバーを起動**（別のターミナルで）:

```bash
cd ~/work/insta-clone-api
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

2. **フロントエンドサーバーを起動**（別のターミナルで）:

```bash
cd ~/work/insta-clone-front
npm run dev
```

3. **ブラウザで動作確認**:
   - `http://localhost:3000` を開く
   - ローディング状態（Skeleton）が表示されることを確認
   - 投稿がない場合は空状態が表示されることを確認
   - 「新規投稿」ボタンをクリック
   - 画像を選択してキャプションを入力
   - 「投稿する」をクリック
   - 成功モーダルが表示されることを確認
   - タイムラインに戻り、投稿が3列レイアウトで表示されることを確認
   - エラーが発生した場合はエラーアラートが表示されることを確認

## ✅ チェックリスト

- [ ] タイムライン画面で API から投稿を取得できる
- [ ] 3列グリッドレイアウトで投稿が表示される
- [ ] ローディング状態（Skeleton）が表示される
- [ ] エラー状態（モーダル）が適切に表示される
- [ ] 投稿がない場合の空状態が表示される
- [ ] 新規投稿画面で画像とキャプションを送信できる
- [ ] 投稿成功時にモーダルとトーストが表示される
- [ ] 投稿後にタイムラインに戻り、新しい投稿が表示される
- [ ] エラーハンドリングが適切に動作する（フォーム内アラート表示）

## 🎯 次のステップ

フロントエンドとバックエンドの連携が完了したら、**step7.md** に進んでください。
（Docker 化：コンテナ化と docker-compose の設定）
