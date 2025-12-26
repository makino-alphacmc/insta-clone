<template>
	<div class="min-h-screen bg-gray-50">
		<!-- ヘッダー -->
		<header class="bg-white border-b border-gray-200">
			<div class="container mx-auto max-w-4xl px-4 py-4">
				<div class="flex items-center gap-4">
					<!-- 戻るボタン -->
					<Button variant="ghost" size="icon" @click="$router.push('/')">
						<svg
							class="w-5 h-5"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M15 19l-7-7 7-7"
							/>
						</svg>
					</Button>
					<h1 class="text-xl font-semibold">新規投稿</h1>
				</div>
			</div>
		</header>
		<!-- メインコンテンツ -->
		<main class="container mx-auto max-w-4xl py-4 px-8">
			<Card>
				<CardHeader>
					<CardTitle>投稿を作成</CardTitle>
				</CardHeader>
				<CardContent>
					<form @submit.prevent="handleSubmit" class="space-y-6">
						<div class="space-y-2">
							<Label for="image">画像を選択</Label>
							<p class="text-sm text-gray-500">
								JPEG、PNG形式の画像をアップロードできます（最大10MB）
							</p>
							<!-- ファイル入力エリア（ドラッグ&ドロップ対応） -->
							<div
								class="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center"
							>
								<Input
									id="image"
									type="file"
									accept="image/*"
									@change="handleFileChange"
									class="hidden"
								/>
								<label for="image" class="cursor-pointer">
									<div class="space-y-4">
										<Button type="button" variant="default">
											ファイルを選択
										</Button>
										<p class="text-sm text-gray-500">または、ここにドラッグ</p>
									</div>
								</label>
							</div>
							<!-- プレビュー画像 -->
							<div v-if="previewUrl" class="mt-4">
								<img
									:src="previewUrl"
									alt="プレビュー画像"
									class="w-full max-h-96 object-contain rounded-lg border border-gray-200"
								/>
							</div>
						</div>
						<!-- キャプション入力セクション -->
						<div class="space-y-2">
							<Label for="caption">キャプション</Label>
							<p class="text-sm text-gray-500">
								投稿に説明文を追加できます（任意）
							</p>
							<Textarea
								id="caption"
								v-model="caption"
								placeholder="キャプションを入力..."
								rows="4"
								:maxlength="500"
							/>
						</div>
						<div class="flex gap-4">
							<Button type="submit" :disabled="!selectedFile" class="flex-1">
								投稿する
							</Button>
							<Button
								type="button"
								variant="outline"
								@click="$router.push('/')"
								class="flex-1"
							>
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

const selectedFile = ref(null)
const previewUrl = ref(null)
const caption = ref('')

// ファイル選択時の処理
const handleFileChange = (event) => {
	// handleFileChange: ファイルが選択された時に実行される関数
	// event: ファイル選択イベント
	const file = event.target.files[0]
	// event.target.files[0]: 選択された最初のファイルを取得
	if (file) {
		// ファイルが選択された場合
		selectedFile.value = file
		// selectedFile.value: 選択されたファイルを保存
		previewUrl.value = URL.createObjectURL(file)
		// URL.createObjectURL(): ファイルからプレビュー用のURLを生成
	}
}

// フォーム送信時の処理（モック実装）
const handleSubmit = () => {
	// handleSubmit: フォーム送信時に実行される関数
	// TODO: ここでAPIを呼び出す（Step 6で実装予定）
	alert('投稿機能はまだ実装されていません（Step 6で実装します）')
	// alert(): ブラウザのアラートダイアログを表示（開発中の一時的な処理）
}
</script>
