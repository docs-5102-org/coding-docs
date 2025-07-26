---
title: Java VCF格式文件导入和导出
category:
  - VCF
---


```java
package com.tuonioooo.test;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.logging.Level;
import java.util.logging.Logger;

import org.junit.Test;
import com.tuonioooo.entity.AddressBean;

/**
 * VCF格式文件的导入导出工具类
 * 支持联系人信息的导入和导出，包括姓名、手机号、工作电话、家庭电话和邮箱
 * 
 * @author tuonioooo
 * @version 2.0
 */
public class VCFContactHandler {
    
    private static final Logger logger = Logger.getLogger(VCFContactHandler.class.getName());
    
    // VCF格式常量
    private static final String VCF_BEGIN = "BEGIN:VCARD";
    private static final String VCF_END = "END:VCARD";
    private static final String VCF_VERSION = "VERSION:2.1";
    private static final String LINE_SEPARATOR = "\r\n";
    
    // 正则表达式模式
    private static final Pattern VCARD_PATTERN = Pattern.compile("BEGIN:VCARD(\\r\\n)([\\s\\S\\r\\n\\.]*?)END:VCARD");
    private static final Pattern NAME_PATTERN = Pattern.compile("N;([\\s\\S\\r\\n\\.]*?)([\\r\\n])");
    private static final Pattern CELL_PATTERN = Pattern.compile("TEL;CELL:([\\d\\s+-]*?)([\\r\\n])");
    private static final Pattern WORK_PATTERN = Pattern.compile("TEL;WORK:([\\d\\s+-]*?)([\\r\\n])");
    private static final Pattern HOME_PATTERN = Pattern.compile("TEL;HOME:([\\d\\s+-]*?)([\\r\\n])");
    private static final Pattern EMAIL_PATTERN = Pattern.compile("\\w+(\\.\\w+)*@\\w+(\\.\\w+)+");
    private static final Pattern NAME_FIELD_PATTERN = Pattern.compile("([A-Za-z0-9-]*?):");

    @Test
    public void testImportVcf() {
        Path vcfFile = Paths.get("src/import_contacts.vcf");
        
        if (!Files.exists(vcfFile)) {
            logger.warning("VCF文件不存在: " + vcfFile.toString());
            return;
        }
        
        try {
            List<AddressBean> contacts = importVCFContacts(vcfFile);
            logger.info("成功导入联系人数量: " + contacts.size());
            
            contacts.forEach(contact -> {
                System.out.println("姓名: " + contact.getTrueName());
                System.out.println("手机: " + contact.getMobile());
                System.out.println("工作电话: " + contact.getWorkMobile());
                System.out.println("家庭电话: " + contact.getTelePhone());
                System.out.println("邮箱: " + contact.getEmail());
                System.out.println("--------------------------------");
            });
        } catch (IOException e) {
            logger.log(Level.SEVERE, "导入VCF文件失败", e);
        }
    }

    @Test
    public void testExportVcf() {
        List<AddressBean> contacts = createTestContacts();
        Path exportFile = Paths.get("src/export_contacts.vcf");
        
        try {
            exportVCFContacts(contacts, exportFile);
            logger.info("VCF文件导出成功: " + exportFile.toString());
        } catch (IOException e) {
            logger.log(Level.SEVERE, "导出VCF文件失败", e);
        }
    }

    /**
     * 从VCF文件导入联系人信息
     * 
     * @param vcfFile VCF文件路径
     * @return 联系人信息列表
     * @throws IOException 文件读取异常
     */
    public static List<AddressBean> importVCFContacts(Path vcfFile) throws IOException {
        try (InputStream inputStream = Files.newInputStream(vcfFile)) {
            return importVCFContacts(inputStream);
        }
    }

    /**
     * 从输入流导入联系人信息
     * 
     * @param inputStream 输入流
     * @return 联系人信息列表
     * @throws IOException 读取异常
     */
    public static List<AddressBean> importVCFContacts(InputStream inputStream) throws IOException {
        List<AddressBean> contacts = new ArrayList<>();
        
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream, StandardCharsets.UTF_8))) {
            StringBuilder content = new StringBuilder();
            String line;
            
            while ((line = readVCFLine(reader)) != null) {
                content.append(line).append(LINE_SEPARATOR);
            }
            
            Matcher vcardMatcher = VCARD_PATTERN.matcher(content.toString());
            while (vcardMatcher.find()) {
                AddressBean contact = parseVCard(vcardMatcher.group(0));
                if (contact != null) {
                    contacts.add(contact);
                }
            }
        } catch (IOException e) {
            logger.log(Level.SEVERE, "读取VCF内容失败", e);
            throw e;
        }
        
        return contacts;
    }

    /**
     * 导出联系人信息到VCF文件
     * 
     * @param contacts 联系人列表
     * @param exportFile 导出文件路径
     * @throws IOException 文件写入异常
     */
    public static void exportVCFContacts(List<AddressBean> contacts, Path exportFile) throws IOException {
        try (BufferedWriter writer = Files.newBufferedWriter(exportFile, StandardCharsets.UTF_8, 
                StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING)) {
            
            for (AddressBean contact : contacts) {
                writeVCard(writer, contact);
            }
            
        } catch (IOException e) {
            logger.log(Level.SEVERE, "写入VCF文件失败", e);
            throw e;
        }
    }

    /**
     * 解析单个VCard记录
     */
    private static AddressBean parseVCard(String vcard) {
        if (vcard == null || vcard.trim().isEmpty()) {
            return null;
        }
        
        AddressBean contact = new AddressBean();
        
        // 解析姓名
        parseName(vcard, contact);
        
        // 解析电话号码
        parsePhoneNumbers(vcard, contact);
        
        // 解析邮箱
        parseEmail(vcard, contact);
        
        return contact;
    }

    /**
     * 解析姓名信息
     */
    private static void parseName(String vcard, AddressBean contact) {
        Matcher nameMatcher = NAME_PATTERN.matcher(vcard);
        if (nameMatcher.find()) {
            String nameField = nameMatcher.group(1);
            
            if (nameField.contains("ENCODING=QUOTED-PRINTABLE")) {
                String encodedName = extractQuotedPrintableName(nameField);
                contact.setTrueName(quotedPrintableDecode(encodedName));
            } else {
                String plainName = extractPlainName(nameField);
                contact.setTrueName(plainName);
            }
        }
    }

    /**
     * 提取Quoted-Printable编码的姓名
     */
    private static String extractQuotedPrintableName(String nameField) {
        int startIndex = nameField.indexOf("ENCODING=QUOTED-PRINTABLE:") + "ENCODING=QUOTED-PRINTABLE:".length();
        String name = nameField.substring(startIndex);
        
        if (name.contains(":")) {
            name = name.substring(name.indexOf(":") + 1);
        }
        
        if (name.contains(";")) {
            name = name.substring(0, name.indexOf(";"));
        }
        
        return name;
    }

    /**
     * 提取普通文本姓名
     */
    private static String extractPlainName(String nameField) {
        Matcher fieldMatcher = NAME_FIELD_PATTERN.matcher(nameField);
        if (fieldMatcher.find()) {
            return nameField.substring(nameField.indexOf(fieldMatcher.group(0)) + fieldMatcher.group(0).length());
        }
        return "";
    }

    /**
     * 解析电话号码
     */
    private static void parsePhoneNumbers(String vcard, AddressBean contact) {
        // 手机号
        Matcher cellMatcher = CELL_PATTERN.matcher(vcard);
        if (cellMatcher.find()) {
            String cellPhone = cellMatcher.group(1).trim();
            contact.setMobile(cellPhone);
        }
        
        // 工作电话
        Matcher workMatcher = WORK_PATTERN.matcher(vcard);
        if (workMatcher.find()) {
            String workPhone = workMatcher.group(1).trim();
            contact.setWorkMobile(workPhone);
        }
        
        // 家庭电话
        Matcher homeMatcher = HOME_PATTERN.matcher(vcard);
        if (homeMatcher.find()) {
            String homePhone = homeMatcher.group(1).trim();
            contact.setTelePhone(homePhone);
        }
    }

    /**
     * 解析邮箱地址
     */
    private static void parseEmail(String vcard, AddressBean contact) {
        Matcher emailMatcher = EMAIL_PATTERN.matcher(vcard);
        if (emailMatcher.find()) {
            contact.setEmail(emailMatcher.group(0));
        }
    }

    /**
     * 写入VCard记录
     */
    private static void writeVCard(BufferedWriter writer, AddressBean contact) throws IOException {
        writer.write(VCF_BEGIN);
        writer.write(LINE_SEPARATOR);
        writer.write(VCF_VERSION);
        writer.write(LINE_SEPARATOR);
        
        // 写入姓名
        if (isNotEmpty(contact.getTrueName())) {
            writer.write("N;CHARSET=UTF-8;ENCODING=QUOTED-PRINTABLE:" + quotedPrintableEncode(contact.getTrueName()) + ";");
            writer.write(LINE_SEPARATOR);
        }
        
        // 写入电话号码
        writePhoneField(writer, "TEL;CELL:", contact.getMobile());
        writePhoneField(writer, "TEL;WORK:", contact.getWorkMobile());
        writePhoneField(writer, "TEL;HOME:", contact.getTelePhone());
        
        // 写入邮箱
        if (isNotEmpty(contact.getEmail())) {
            writer.write("EMAIL:" + contact.getEmail());
            writer.write(LINE_SEPARATOR);
        }
        
        writer.write(VCF_END);
        writer.write(LINE_SEPARATOR);
    }

    /**
     * 写入电话字段
     */
    private static void writePhoneField(BufferedWriter writer, String prefix, String phone) throws IOException {
        if (isNotEmpty(phone)) {
            writer.write(prefix + phone);
            writer.write(LINE_SEPARATOR);
        }
    }

    /**
     * 读取VCF文件行，处理折行
     */
    private static String readVCFLine(BufferedReader reader) throws IOException {
        String line;
        
        do {
            line = reader.readLine();
            if (line == null) {
                return null;
            }
        } while (line.length() == 0);
        
        // 处理以=结尾的折行
        while (line.endsWith("=")) {
            line = line.substring(0, line.length() - 1);
            String nextLine = reader.readLine();
            if (nextLine != null) {
                line += nextLine;
            }
        }
        
        // 处理以空格或制表符开头的续行
        reader.mark(1000);
        String nextLine = reader.readLine();
        if (nextLine != null && nextLine.length() > 0 && 
            (nextLine.charAt(0) == 0x20 || nextLine.charAt(0) == 0x09)) {
            line += nextLine.substring(1);
        } else {
            reader.reset();
        }
        
        return line.trim();
    }

    /**
     * Quoted-Printable解码
     */
    private static String quotedPrintableDecode(String input) {
        if (input == null || input.isEmpty()) {
            return "";
        }
        
        try {
            String processed = input.replaceAll("=\n", "");
            byte[] bytes = processed.getBytes(StandardCharsets.US_ASCII);
            
            // 处理下划线转空格
            for (int i = 0; i < bytes.length; i++) {
                if (bytes[i] == 95) { // 下划线ASCII码
                    bytes[i] = 32; // 空格ASCII码
                }
            }
            
            ByteArrayOutputStream buffer = new ByteArrayOutputStream();
            for (int i = 0; i < bytes.length; i++) {
                int b = bytes[i];
                if (b == '=') {
                    try {
                        int upper = Character.digit((char) bytes[++i], 16);
                        int lower = Character.digit((char) bytes[++i], 16);
                        if (upper != -1 && lower != -1) {
                            buffer.write((upper << 4) + lower);
                        }
                    } catch (ArrayIndexOutOfBoundsException e) {
                        logger.warning("Quoted-Printable解码异常: " + e.getMessage());
                    }
                } else {
                    buffer.write(b);
                }
            }
            
            return buffer.toString(StandardCharsets.UTF_8);
        } catch (Exception e) {
            logger.log(Level.WARNING, "Quoted-Printable解码失败", e);
            return input;
        }
    }

    /**
     * Quoted-Printable编码
     */
    private static String quotedPrintableEncode(String input) {
        if (input == null || input.isEmpty()) {
            return "";
        }
        
        StringBuilder result = new StringBuilder();
        
        try {
            byte[] bytes = input.getBytes(StandardCharsets.UTF_8);
            for (byte b : bytes) {
                int unsignedByte = b & 0xFF;
                String hex = Integer.toHexString(unsignedByte).toUpperCase();
                if (hex.length() == 1) {
                    hex = "0" + hex;
                }
                result.append("=").append(hex);
            }
        } catch (Exception e) {
            logger.log(Level.WARNING, "Quoted-Printable编码失败", e);
            return input;
        }
        
        return result.toString();
    }

    /**
     * 创建测试联系人数据
     */
    private static List<AddressBean> createTestContacts() {
        List<AddressBean> contacts = new ArrayList<>();
        
        AddressBean contact1 = new AddressBean();
        contact1.setTrueName("张杰");
        contact1.setMobile("18255963695");
        contact1.setWorkMobile("021-12345678");
        contact1.setEmail("zhangjie@example.com");
        contacts.add(contact1);
        
        AddressBean contact2 = new AddressBean();
        contact2.setTrueName("张三");
        contact2.setMobile("15255963695");
        contact2.setTelePhone("010-87654321");
        contact2.setEmail("zhangsan@example.com");
        contacts.add(contact2);
        
        return contacts;
    }

    /**
     * 检查字符串是否不为空
     */
    private static boolean isNotEmpty(String str) {
        return str != null && !str.trim().isEmpty();
    }
}
```