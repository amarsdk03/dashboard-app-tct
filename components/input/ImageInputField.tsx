import React, { useRef } from 'react';
import { Image, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ImageIcon, LinkIcon, UploadIcon, XIcon } from 'lucide-react-native';
import { InterText } from '@/components/generic/InterText';

type Props = {
    label: string;
    value: string | null;
    readonly?: boolean;
    onChange: (value: string) => void;
    placeholder?: string;
};

function getMimeType(uri: string, fallback = 'image/jpeg') {
    const lower = uri.toLowerCase();
    if (lower.endsWith('.png')) return 'image/png';
    if (lower.endsWith('.webp')) return 'image/webp';
    return fallback;
}

export default function ImageInputField({
    label,
    value,
    readonly = false,
    onChange,
    placeholder = 'https://example.com/foto.png',
}: Props) {
    const webInputRef = useRef<HTMLInputElement | null>(null);

    async function pickNativeImage() {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.78,
            base64: true,
        });

        if (result.canceled || !result.assets[0]) return;

        const asset = result.assets[0];
        if (asset.base64) {
            const mimeType = asset.mimeType ?? getMimeType(asset.uri);
            onChange(`data:${mimeType};base64,${asset.base64}`);
            return;
        }

        onChange(asset.uri);
    }

    function handleWebFileChange(event: React.ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            if (typeof reader.result === 'string') {
                onChange(reader.result);
            }
        };
        reader.readAsDataURL(file);
        event.target.value = '';
    }

    function handlePickImage() {
        if (readonly) return;

        if (Platform.OS === 'web') {
            webInputRef.current?.click();
            return;
        }

        pickNativeImage().then(() => null);
    }

    return (
        <View style={styles.inputContainer}>
            <InterText style={styles.label}>{label}:</InterText>

            <View style={styles.previewRow}>
                {value ? (
                    <Image source={{ uri: value }} style={styles.preview} resizeMode="cover" />
                ) : (
                    <View style={styles.emptyPreview}>
                        <ImageIcon size={24} color="#94a3b8" />
                    </View>
                )}

                <View style={styles.controls}>
                    <View style={[styles.urlBox, readonly && styles.readonlyUrlBox]}>
                        <LinkIcon size={14} color="#94a3b8" />
                        <TextInput
                            editable={!readonly}
                            value={value ?? ''}
                            onChangeText={onChange}
                            placeholder={readonly ? 'N/A' : placeholder}
                            placeholderTextColor={readonly ? '#737373' : '#94a3b8'}
                            style={[styles.urlInput, readonly && styles.readonlyUrlInput]}
                        />
                    </View>

                    {!readonly && (
                        <View style={styles.actionsRow}>
                            <Pressable style={styles.pickButton} onPress={handlePickImage}>
                                <UploadIcon size={15} color="#ffffff" />
                                <InterText style={styles.pickButtonText}>Scegli immagine</InterText>
                            </Pressable>
                            {value && (
                                <Pressable style={styles.clearButton} onPress={() => onChange('')}>
                                    <XIcon size={15} color="#7c3f3f" />
                                </Pressable>
                            )}
                        </View>
                    )}
                </View>
            </View>

            {Platform.OS === 'web' && !readonly && (
                <input
                    ref={webInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleWebFileChange}
                    style={{ display: 'none' }}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    inputContainer: {
        marginBottom: 20,
        width: '100%',
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: '#111111',
        marginBottom: 6,
        fontFamily: 'Inter-Medium',
    },
    previewRow: {
        flexDirection: 'row',
        gap: 12,
        alignItems: 'flex-start',
    },
    preview: {
        width: 76,
        height: 76,
        borderRadius: 38,
        backgroundColor: '#f1f5f9',
    },
    emptyPreview: {
        width: 76,
        height: 76,
        borderRadius: 38,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f1f5f9',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    controls: {
        flex: 1,
        minWidth: 0,
        gap: 8,
    },
    urlBox: {
        minHeight: 44,
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 10,
        paddingHorizontal: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    readonlyUrlBox: {
        backgroundColor: '#ffffff',
        borderColor: '#ffffff00',
        paddingHorizontal: 0,
    },
    urlInput: {
        flex: 1,
        color: '#0f172a',
        fontSize: 13,
        fontFamily: 'Inter',
        paddingVertical: 10,
    },
    readonlyUrlInput: {
        color: '#737373',
        paddingVertical: 0,
    },
    actionsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    pickButton: {
        flex: 1,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: '#0f172a',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    pickButtonText: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: '600',
        fontFamily: 'Inter-SemiBold',
    },
    clearButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#d9a3a3',
        alignItems: 'center',
        justifyContent: 'center',
    },
});
