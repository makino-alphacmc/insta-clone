<template>
	<div class="min-h-screen bg-gray-50">
		<!-- ヘッダー -->
		<header class="bg-white border-b border-gray-200">
			<div class="container mx-auto max-w-7xl px-4 py-4">
				<div class="flex justify-between items-center">
					<h1 class="text-2xl font-bold">Jeligramy</h1>
					<Button as-child>
						<NuxtLink to="/post/new">新規投稿</NuxtLink>
					</Button>
				</div>
			</div>
		</header>

		<!-- メイン -->
		<main class="container mx-auto max-w-7xl px-4 py-8">
			<div v-if="posts.length == 0" class="text-center py-20">
				<div class="mb-4">
					<div
						class="w-20 h-20 mx-auto bg-gray-100 rounded-lg flex items-center justify-center"
					>
						<svg
							class="w-10 h-10 text-gray-400"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						></svg>
					</div>
				</div>
				<p class="text-lg text-gray-500 mb-2">まだ投稿がありません</p>
				<p class="text-sm text-gray-400 mb-6">
					最初の投稿を作成して、みんなとシェアしましょう
				</p>
				<Button as-child>
					<NuxtLink to="/post/new">最初の投稿を作成</NuxtLink>
				</Button>
			</div>

			<!-- 投稿一覧 -->
			<div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				<Card v-for="post in posts" :key="post.id" class="overflow-hidden">
					<CardHeader class="pb-3">
						<div class="flex items-center gap-3">
							<Avatar>
								<AvatarFallback>{{
									post.username?.charAt(0) || 'U'
								}}</AvatarFallback>
							</Avatar>
							<div class="flex-1">
								<p class="font-semibold text-sm">
									{{ post.username || 'User' }}
								</p>
								<p class="text-xs text-gray-500">
									{{ formatDate(post.created_at) }}
								</p>
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

// モックデータ
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
